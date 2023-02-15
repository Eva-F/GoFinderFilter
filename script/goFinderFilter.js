var minSize = '100MB';     //pr. 100kB, 1.5GB (pozor, musi byt tecka jako desetinny oddelovac)
var maxSize = '2GB';
var excludestr = ['.part', '.log', 'The ', 'The.', 'Various', 'VA -', '.avi', '.mkv', '.ts', '.mp4', 'FLAC', 'zip.0', '7z.0'];
var gofinderlink = 'https://entry.gozofinder.com/redirect/';  // nekdy jej meni - predtim byl https://entry.gozofinder.com/redirect-hash/
var ascrolltimeout = 100;
var ascrollsize = 250;


// s nastavenim timeoutu je mozne si pohrat - nicmene plati, ze vsechny linky musi byt vykresleny ( jinak nebudou zahrnuty do vysledku hledani - nevykreslene linky - sede obdelniky
// obdobne si lze pohrat i velikosti posunu scrolovani - plati to same jako pro timeout -
// cim mensi timeout (mel by byt urcite > 10ms) a cim vetsi scrollsize, tim rychleji se odroluji vsechny linky vyhovujici "search" -
// nicmene je treba vzit v potaz rychlost pripojeni, pocitace atd, aby nedoslo k tomu, ze se linky neprokresli - viz vyse
// rolovani je nutny kvuli pagovani Gofinderu - nacte max. 30 linku a postupne umazava ty, ktere odrolovaly nahoru -
//  t.j. v gofinder resultu je mozne vyhledavat (ctrl+F) pouze v aktualne nactene page
// vysledek filtru je ulozen v localstorage browseru (pod jmenem vytvorenym ze search stringu a minsize a maxsize) a pri pristim spusteni nacten a porovnan s vysledkem z gofinderu - prednostne jsou ukazany nove linky
// obcas diky potvrzeni captcha se par linku nenacte a ty se mohou pri pristim spusteni objevit jako nove linky
// The localStorage object stores the data with no expiration date. The data will not be deleted when the browser is closed, and will be available the next day
// created by EvaF


var searchedrefsstored = false;
var scrollcontinue = true;
var ablocker;
var ablockedElement;
var ahtml;
var ahrefs;
var newrefs = {};
var refs = {};
var orderedrefs;
var orderednewrefs;
var scrolled;
var cntscrolled = 0;
var reversescroll=0;
var res;
var modalclosed = false;


if (typeof minSize === 'undefined') {
    minSize = '150MB';
}
if (typeof maxSize === 'undefined') {
    maxSize = '999MB'
}


var minSizeB = parseFloat(minSize);
var asize = minSize.replace('' + minSizeB, '').trim();
if (asize.substr(0, 1).toUpperCase() == 'M') {
    minSizeB = minSizeB * (1 << 20)
} else if (asize.substr(0, 1).toUpperCase() == 'K') {
    minSizeB = minSizeB * (1 << 10)
} else if (asize.substr(0, 1).toUpperCase() == 'G') {
    minSizeB = minSizeB * (1 << 30)
} else if (asize.substr(0, 1).toUpperCase() == 'T') {
    minSizeB = minSizeB * (1 << 40)
}
var maxSizeB = parseFloat(maxSize);
asize = maxSize.replace('' + maxSizeB, '').trim();
if (asize.substr(0, 1).toUpperCase() == 'M') {
    maxSizeB = maxSizeB * (1 << 20)
} else if (asize.substr(0, 1).toUpperCase() == 'K') {
    maxSizeB = maxSizeB * (1 << 10)
} else if (asize.substr(0, 1).toUpperCase() == 'G') {
    maxSizeB = maxSizeB * (1 << 30)
} else if (asize.substr(0, 1).toUpperCase() == 'T') {
    maxSizeB = maxSizeB * (1 << 40)
}

var searchStr = document.querySelectorAll('input[type="search"]')[0].value;
var searchedrefs = (localStorage.getItem("refs_" + searchStr + '__' + minSize + '_' + maxSize) == null) ? {} : JSON.parse(localStorage.getItem("refs_" + searchStr + '__' + minSize + '_' + maxSize));

function numberWithCommas(x, replacechar) {

    var parts = x.toFixed(1).split(".");
    parts[0] = ('____' + parts[0]).slice(-4);
    if (typeof replacechar !== 'undefined') {
        parts[0] = parts[0].replace(/_/g, replacechar)
    }
    return parts.join(".");
}

function getAsB(len) {
    if (len >> 30 > 0) {
        return numberWithCommas(Math.round(10 * len / (1 << 30)) / 10) + ' GB';
    } else if (len >> 20 > 0) {
        return numberWithCommas(Math.round(10 * len / (1 << 20)) / 10) + ' MB';
    } else if (len >> 10 > 0) {
        return numberWithCommas(Math.round(10 * len / (1 << 10)) / 10) + ' KB';
    } else {
        return numberWithCommas(len) + '  B';
    }
}

function parseRefsKey(key, maxchars) {
    var akey = key.split('_');
    var strkey;
    if (key.indexOf('__') > 0) {
        strkey = akey[1] + ' (' + akey[3] + '-' + akey[4] + ')';
    } else {
        strkey = akey[1];
        for (var i = 1; i < strkey.length; i++) {
            if (strkey[i] >= '1' && strkey[i] <= '9') {
                var strrange = strkey.substr(i);
                strkey = strkey.substr(0, i) + ' (' + strrange + ')';
                break;
            }
        }
    }
    var str = new Array(maxchars - strkey.length).join('_');
    return strkey + str;
}


function openModal(inputsearch, modalEl, modalContainerEl) {

    // Compute and apply the transform to deform the modal to cover the note with a transition to make it animate
    const transform = computeTransform(inputsearch);
    modalEl.style.transform = transform;
    modalEl.style.transition = 'transform 250ms';

    // Setup the modal background animate in too
    modalContainerEl.style.backgroundColor = 'transparent';
    modalContainerEl.style.transition = 'background-color 250ms';

    // Show the modal
    modalContainerEl.classList.add('div_dialog_open');

    // Put the rest in a setTimeout to allow the styles applied above to take
    // affect and render before we overwrite them with new ones below
    setTimeout(function () {
        // Remove the transform to allow the modal to return to it's natural shape and position
        modalEl.style.transform = 'none';
        modalContainerEl.style.backgroundColor = 'rgba(33, 33, 33, 0.5)';
    }, 0)


}

function computeTransform(inputsearch) {

// Modal positions here are hardcoded to match styles set in CSS
    const modalTop = 150;
    const modalLeft = (document.body.offsetWidth / 2) - 300;
    const modalWidth = 600;
    const modalHeight = 600;

// Get input div's position relative to the viewport
    const inputPosition = inputsearch.getBoundingClientRect();

// Compute a CSS transform that moves the modal to match the input's position
    const translateX = inputPosition.left - modalLeft;
    const translateY = inputPosition.top - modalTop;
    const scaleX = inputPosition.width / modalWidth;
    const scaleY = inputPosition.height / modalHeight;

    return `translateX(${translateX}px) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`;
}

function checkLocalStorage() {
    var alen = 0;
    var als = {};
    var maxchars = 0;
    for (key in localStorage) {
        var len = localStorage[key].length;
        if (len) {
            alen += localStorage[key].length;
            if (key.indexOf('refs_') == 0) {
                als[key] = len;
                maxchars = maxchars < key.length ? key.length : maxchars;
            }
        }
    }
    if (alen > 4.5 * (1 << 20)) {
        var css = '.localstorage_full {\n' +
            '  position: relative;\n' +
            '  padding: 20px;\n' +
            '  border-radius: 15px;\n' +
            '  background-color: #ccc9e191;\n' +
            '}\n' +
            '.localstorage_full h1 {' +
            '    font-size: 16px;' +
            '}\n' +
            '.localstorage_full h3 {' +
            '    font-size: 12px;' +
            '}\n' +
            '.dialog_body {' +
            '   background-color: white;' +
            '   padding: 20px;' +
            '   min-height:200px;' +
            '}\n' +
            '.dialog_body div{' +
            '   padding: 10px;' +

            '}\n' +
            '.div_dialog {\n' +
            '  display: none;\n' +
            '  position: fixed;\n' +
            '  top: 0;\n' +
            '  left: 0;\n' +
            '  bottom: 0;\n' +
            '  right: 0;\n' +
            '  background-color: rgba(33, 33, 33, 0.5);\n' +
            '}\n' +
            '.div_dialog_open {\n' +
            '        display: block;\n' +
            '      }' +
            '\n' +
            '.display_dialog {\n' +
            '        position: absolute;\n' +
            '        top: 150px;\n' +
            '        left: 50%;\n' +
            '        margin-left: -300px;\n' +
            '        width: 600px;\n' +
            '        height: 350px;\n' +
            '        \n' +
            '        transform-origin: top left;\n' +
            '        will-change: transform; /* makes the animation run smoother */\n' +
            '\n' +
            '        background-color: #EEE;\n' +
            '        border-radius: 10px;\n' +
            '      }' +
            '\n' +
            'select.refs_ {\n' +
            '  font-family: monospace;\n' +
            '  padding: 10px;\n' +
            '  border: none;\n' +
            '}\n' +
            '\n' +
            'button.refs_ {\n' +
            '  float: right;\n' +
            '  background-color: #ccc9e191;\n' +
            '  padding: 10px;\n' +
            '  border-radius: 8px;\n' +
            '  line-height: 0.6;' +
            '  font-size: 17px;\n' +
            '  transition: 0.4s;\n' +
            '  font-weight: bold;\n' +
            '  outline: none;\n' +
            '}\n' +
            '\n' +
            '' +
            'button.refs_:hover {\n' +
            '  background-color: #E3E3E3;\n' +
            '}',
            head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        head.appendChild(style);

        style.type = 'text/css';
        if (style.styleSheet) {
            // This is required for IE8 and below.
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
        var div_dialog = document.createElement('div');
        div_dialog.classList.add('div_dialog');
        div_dialog.id = 'id_div_dialog';

        main.appendChild(div_dialog);

        var display_dialog = document.createElement('div');
        display_dialog.classList.add('display_dialog');
        display_dialog.classList.add('modal');
        div_dialog.appendChild(display_dialog);

        var localstorage_full = document.createElement('div');
        localstorage_full.classList.add('localstorage_full');
        display_dialog.appendChild(localstorage_full);

        var h1localstorage_full = document.createElement('h1');
        h1localstorage_full.innerText = 'Lokalni uloziste je temer plne ';
        localstorage_full.appendChild(h1localstorage_full);

        var h3localstorage_full = document.createElement('h3');
        h3localstorage_full.innerText = 'kapacita je 5MB, nyni zabira ' + numberWithCommas(Math.round(10 * alen / (1 << 20)) / 10, ' ') + 'MB. Zvazte, zda jej neprocistit, aby vysledek vyhledavani byl bezpecne ulozen';
        localstorage_full.appendChild(h3localstorage_full);

        h3localstorage_full = document.createElement('h3');
        h3localstorage_full.innerText = '(oznacene polozky budou smazany)';
        localstorage_full.appendChild(h3localstorage_full);

        var dialog_body = document.createElement('div');
        dialog_body.classList.add('dialog_body');

        display_dialog.appendChild(dialog_body);
        var divtext = document.createElement('div');
        divtext.innerText = 'seznam ulozenych hledani';
        dialog_body.appendChild(divtext);

        var select_refs = document.createElement('select');
        select_refs.id = 'id_select_refs';
        select_refs.classList.add('refs_');
        select_refs.setAttribute('multiple', 'multiple');
        select_refs.setAttribute('title', 'oznacte jen ty, jejichz seznam neni prilis dlouhy a nevyhledavate je prilis casto');
        select_refs.setAttribute('size', '8');

        dialog_body.appendChild(select_refs);
        var sortedals = Object.keys(als).sort(Intl.Collator().compare);
        for (var i = 0; i < sortedals.length; i++) {
            var key = sortedals[i];
            if (key.indexOf('refs_') == 0) {
                var option = document.createElement("option");
                option.value = key;
                var str = new Array(maxchars - key.length + 5).join('_');
                option.text = parseRefsKey(key, maxchars) + getAsB(als[key]);
                select_refs.appendChild(option);
            }
        }
        var button_refs = document.createElement('button');
        button_refs.classList.add('refs_');
        button_refs.id = 'button_refs';
        button_refs.innerText = 'OK';
        button_refs.onclick = function () {
            closeModal(document.getElementById('id_div_dialog'))
        };
        dialog_body.appendChild(button_refs);

        openModal(document.querySelector('input[type="search"]'), display_dialog, div_dialog);
        return true;
    } else {
        return false;
    }


    //
    //
    //     var close_btn = document.getElementById('close_btn');
    //     example_note.onclick = function() {
    //       document.getElementsByClassName('background_change')[0].style.display = "block";
    //       document.getElementsByClassName('display_block')[0].style.display = "block";
    //       example_note.style.display="none";
    //     }
    //
    //     close_btn.onclick = function() {
    //       document.getElementsByClassName('background_change')[0].style.display = "none";
    //       document.getElementsByClassName('display_block')[0].style.display = "none";
    //       example_note.style.display="block";
    //     }
    // }


}

const readPage = () => {
    ahrefs = document.querySelectorAll('a[href^="' + gofinderlink + '"]:not(.image)');


    for (var i = 0; i < ahrefs.length; i++) {
        var alink = ahrefs[i].getAttribute('href');
        var atitle = ahrefs[i].getAttribute('title');
        var excludetitle = false;
        for (var l = 0; l < excludestr.length; l++) {
            if (atitle.indexOf(excludestr[l]) >= 0) {
                excludetitle = true;
                break;
            }
        }
        if (excludetitle) {
            continue;
        }

        var pc = ahrefs[i].parentElement;
        while (true) {
            if (pc.tagName !== 'DIV') {
                pc = pc.parentElement;
                continue
            }
            if (!pc.querySelectorAll('div.properties').length) {
                pc = pc.parentElement;

                continue
            }
            break;
        }
        if (pc !== null) {


            var pcp = pc.querySelectorAll('div.properties');
            if (pcp.length) {
                var pcpspan = pcp[0].querySelectorAll('span');
                for (var j = 0; j < pcpspan.length; j++) {
                    {
                        var asize = pcpspan[j].innerHTML;
                        var asizeB = parseFloat(asize);
                        var aunit = asize.replace('' + asizeB, '').trim();
                        if (aunit.toUpperCase() == 'MIN') {
                            asizeB = asizeB * (1 << 20) * 77 / 53
                        } else if (aunit.substr(0, 1).toUpperCase() == 'M') {
                            asizeB = asizeB * (1 << 20)
                        } else if (aunit.substr(0, 1).toUpperCase() == 'K') {
                            asizeB = asizeB * (1 << 10)
                        } else if (aunit.substr(0, 1).toUpperCase() == 'G') {
                            asizeB = asizeB * (1 << 30)
                        } else if (aunit.substr(0, 1).toUpperCase() == 'T') {
                            asizeB = asizeB * (1 << 40)
                        }
                        if (asizeB >= minSizeB && asizeB <= maxSizeB) {
                            if (typeof refs[atitle] === 'undefined') {
                                if (typeof refs[atitle] === 'undefined') {
                                    refs[atitle] = []
                                }
                                refs[atitle].push({"l": alink, "s": asize});
                            }
                            if (typeof searchedrefs[atitle] === 'undefined') {
                                if (typeof newrefs[atitle] === 'undefined') {

                                    if (typeof newrefs[atitle] === 'undefined') {
                                        newrefs[atitle] = []
                                    }
                                    var im = '';

                                    if (searchedrefsstored) {
                                        var pci = pc.parentElement.querySelectorAll('a.image');

                                        if (pci.length && pci[0].querySelectorAll('.thumb').length && pci[0].querySelectorAll('.thumb')[0].childElementCount) {
                                            im = pci[0].querySelectorAll('.thumb')[0].children[0].outerHTML;
                                        }
                                    }


                                    newrefs[atitle].push({"l": alink, "s": asize, "i": im})
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

function showBlocker() {
    var cssString = "z-index: 1000; border: none; margin: 0px; padding: 0px;width: 100%; height: 100%; top: 0px; left: 0px; background-color: rgb(0, 0, 0); opacity: 0.6; cursor: wait; position: fixed;";
    ablocker = document.createElement('div');
    ablocker.style.cssText = cssString;
    ablocker.title = "kliknete kamkoli pro vygenerovani vystupu";

    ablockedElement.appendChild(ablocker);
    var adiv = document.createElement('div');
    cssString = "z-index: 1011; position: fixed; padding: 15px; margin: 0px; width: 30%; top: 40%; left: 35%; text-align: center; color: rgb(0, 0, 0); border: 3px solid rgb(170, 170, 170); opacity: 1; background-color: rgb(255, 255, 255); cursor: wait;";
    adiv.style.cssText = cssString;
    adiv.innerHTML = '<h1>Nacitani dokonceno...</h1>';
    ablocker.appendChild(adiv);

}

function hideBlocker() {
    ablockedElement.removeChild(ablocker);
}


function generateOutputAfterClick(event) {

    if (event) {
        hideBlocker();
        event.preventDefault();
        event.stopPropagation();
        document.removeEventListener('click', generateOutputAfterClick);
    }
    scrollcontinue = false;

    localStorage.setItem("refs_" + searchStr + '__' + minSize + '_' + maxSize, JSON.stringify(refs));

    refswindow = window.open();
    refsdocument = refswindow.document;

    refsdocument.write('<h1>Nove linky</h1>');
    refsdocument.write('<h3><b>Search:</b>' + searchStr + '</h3>');
    refsdocument.write('<h3><b>Filter:</b> velikost od ' + minSize + ' do ' + maxSize + '</h3>');
    var ahtml = '<table cellpadding="5px"><tr><th style="max-width:48px"></th><th style="max-width:85%">nazev</th><th>velikost</th></tr>';
    refsdocument.write(ahtml);
    orderednewrefs = Object.keys(newrefs).sort(Intl.Collator().compare);

    for (var ii = 0; ii < orderednewrefs.length; ii++) {
        ititle = orderednewrefs[ii];
        for (var i = 0; i < newrefs[ititle].length; i++) {
            var im = '';
            if (newrefs[ititle][i]['i'] !== '') {
                im = newrefs[ititle][i]['i'].replace('<img', '<img style="width: 100px!important;" ');
            }
            refsdocument.write('<tr><td>' + im + '</td><td style="white-space:break-spaces"><a href="' + newrefs[ititle][i]['l'] + '" target="_blank">' + ititle + '</a></td><td>' + newrefs[ititle][i]['s'] + ' </td></tr>');
        }
    }
    orderednewrefs = [];
    newrefs = {};
    refsdocument.write('</table>');
    refsdocument.write('<br><br><br>');
    refsdocument.write('<h1>Chybejici linky(smazane, nebo zastarale)</h1>');
    var ahtml = '<table cellpadding="5px"><tr><th style="max-width:48px"></th><th style="max-width:85%">nazev</th><th>velikost</th></tr>';
    refsdocument.write(ahtml);
    orderedsearchedrefs = Object.keys(searchedrefs).sort(Intl.Collator().compare);

    for (var ii = 0; ii < orderedsearchedrefs.length; ii++) {
        ititle = orderedsearchedrefs[ii];
        if (typeof refs[ititle] == 'undefined') {
            for (var i = 0; i < searchedrefs[ititle].length; i++) {

                refsdocument.write('<tr><td></td><td style="white-space:break-spaces"><a href="' + searchedrefs[ititle][i]['l'] + '" target="_blank">' + ititle + '</a></td><td>' + searchedrefs[ititle][i]['s'] + ' </td></tr>');
            }
        }
    }
    orderedsearchedrefs = [];
    newrefs = {};
    refsdocument.write('</table>');
    refsdocument.write('<br><br><br>');


    refsdocument.write('<h1>vsechny linky</h1>');
    var ahtml = '<table><tr><th>nazev</th><th>velikost</th></tr>';
    refsdocument.write(ahtml);
    orderedrefs = Object.keys(refs).sort(Intl.Collator().compare);
    for (var ii = 0; ii < orderedrefs.length; ii++) {
        ititle = orderedrefs[ii];
        for (var i = 0; i < refs[ititle].length; i++) {
            refsdocument.write('<tr><td><a href="' + refs[ititle][i]['l'] + '"  target="_blank">' + ititle + '</a></td><td>' + refs[ititle][i]['s'] + ' </td></tr>');
        }
    }
    orderedrefs = [];
    refs = {};
    searchedrefs = {};
    refsdocument.write('</table>');
    refsdocument.close();
    document.removeEventListener('keypress', generateOutput);
    document.removeEventListener('scroll', winScroll);
}

function generateOutput(event) {
    if (event.keyCode == 13) {
        if (typeof event.manually == 'undefined') {
            event.preventDefault();
            event.stopPropagation();
            generateOutputAfterClick();
        } else
            ablockedElement = document.createElement("div");
        main.children[0].appendChild(ablockedElement);
        main.children[0].appendChild(ablockedElement);
        showBlocker();
        document.addEventListener('click', generateOutputAfterClick);
    }
}

function winScroll(event) {
    scrolled = true;
    cntscrolled = 0;
}

let isTicking;
const debounce = (callback, evt) => {
    if (isTicking) return;
    requestAnimationFrame(() => {
        callback(evt);
        isTicking = false;
    });
    isTicking = true;
};

function runGenerateOutput() {
    setTimeout(function () {
        var ev = {};
        ev.keyCode = 13;
        ev.manually = true;
        generateOutput(ev);
    }, 1);
}

function pageScroll() {
    if (!scrollcontinue) {
        console.log('konec scrollcontinue');

        return;
    }
    if (!scrolled) {
        if (cntscrolled > 10) {
            cntscrolled = 0;
            scrollcontinue = false;
            runGenerateOutput();

            return;
        } else {
            if (document.getElementsByClassName('captcha').length == 0) {
              cntscrolled++;
            } else {
              reversescroll+=ascrollsize;
                cntscrolled=0;
            }

        }
    }
    scrolled = false;
    var reversed = false;
     if (document.getElementsByClassName('captcha').length == 0 && reversescroll>0 ) {
         window.scrollBy(0, -reversescroll);
         reversescroll = 0;
         reversed = true;
     } else {
        window.scrollBy(0, ascrollsize);
     }
    if (!reversed) {
    res = main.children[0].children[main.children[0].childElementCount - 2].lastElementChild;
    if (res !== null && res.style.transform != '' && res.style.transform.indexOf('translateY') >= 0) {
        var trY = parseInt(res.style.transform.replace('translateY(', ''))
        console.log(trY);
        if (trY + res.offsetHeight + 100 > main.offsetHeight) {
            console.log('konec ' + trY + main.offsetHeight);
            runGenerateOutput();
            return;
        }
    }
    }
    scrolldelay = setTimeout(pageScroll, ascrolltimeout);
}

function closeModal(modalContainerEl) {
    var selel = document.getElementById("id_select_refs");
    if (selel) {
        var options = selel && selel.options;
        var opt;
        for (var i = 0, iLen = options.length; i < iLen; i++) {
            opt = options[i];
            if (opt.selected) {
                localStorage.removeItem(opt.value);
            }
        }

    }
    document.getElementById("id_div_dialog").remove();

    modalclosed = true;
    startReading();
    pageScroll();

}

function startReading() {
    document.addEventListener('keypress', generateOutput);
    window.addEventListener('scroll', winScroll, {passive: true});
    const handleScroll = evt => readPage();
    document.defaultView.onscroll = evt => debounce(handleScroll, evt);
    readPage();

    searchedrefsstored = Object.keys(searchedrefs).length;

    var noNextResults = main.children[0].children[1];
}

var main = document.getElementsByTagName('main')[0];

if (checkLocalStorage()) {
} else {
    startReading();
    pageScroll();
}









