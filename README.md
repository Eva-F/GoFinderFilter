# GozoFinderFilter for uloz.to

tento script je urcen pro zjednoduseni prace s GozoFinder pro uloz.to

**doporucene browsery:**
- Chrome
- Safari
- Edge

proste vsechny, ktere umoznuji ukladat js scripty do Snippets (Firefox umoznuje pracovat se snippet, ale neumi jej ukladat, takze se script musi kopirovat do FF snippetu po kazdym refresh stranky

script je urcen pro vyhledavani v uloz.to pomoci GozoFinder 

(t.j. link vypada nejak takto:
[https://gozofinder.com/cse/ulozto/cz?query=audiokniha](https://gozofinder.com/cse/ulozto/cz?query=audiokniha) (kde search string = "audiokniha"))

**Jak pracovat se scriptem (napr.v Chrome)**
- na strance GozoFinder otevrete devTools (**Ctrl+Shift+J**)

- umistete devTools okno bud po prave strane ci do samostatneho okna
-  
  ![devTools](https://user-images.githubusercontent.com/3242659/218735620-16a2d9e6-9020-444c-b514-547fc855139e.png)
  
- kliknete na zalozku "Source", pote na "Snippets" a vytvorte novy snippet
- 
  ![devToolsSnippets](https://user-images.githubusercontent.com/3242659/218737226-dccaac05-9106-4f13-89c7-2c7334372c26.png)
  
- pojmenujte Snippet podle typu hledani napr. "GoFinderFilter_Audiokniha" (vysledky hledani se ukladaji v lokalnim ulozisti(=localStorage) a hodnoty ulozene v localStorage nemaji expiraci a  pretrvavaji i po ukonceni browseru )

- do prazdneho okna zkopirujte script 
  ![devToolsNewSnippet](https://user-images.githubusercontent.com/3242659/218739768-176c52fa-9921-442d-9568-6608e7f9f49a.png)
  ![gofinderGit](https://user-images.githubusercontent.com/3242659/218740385-340e5ee3-f83c-4a96-840a-6c2f7e214a18.png) 
  (v raw rezimu prostym Ctrl+A, Ctrl+C, Ctrl+V) 
  
- ve Snippetu najedte na prvni radek a upravte parametry vyhledavani (v kazdem Snippetu mohou byt ruzne parametry)
  ![goFinderParameters](https://user-images.githubusercontent.com/3242659/218741829-294d541c-c5d4-4eca-9d09-5dc10a9d69d1.png)
  
- spustte snippet

  ![goFinderRun](https://user-images.githubusercontent.com/3242659/218742496-474f4680-6b8e-4804-8fdf-432f6c04bfe7.png)
  
- odkazy odpovidajici search stringu budou postupne rolovat( to je nutne, aby se nacetly vsechny - GozoFinder provadi paging takze v jednom okamziku je nacteno max. 30 odkazu).

- v dobe rolovani se muzete venovat jine cinnosti - jen obas hodte okem na stranku GozoFinderu, zda vam tam iniciativne nepodstrcil "Captcha"  - pokud ano, odklepnete, ze nejse bot a nechte ho pokracovat v rolovani.

- Rolovani je ukonceno, pokud GoFinder odesle vsechny sve odkazy ( v pripade dlouheho seznamu to seka (tusim na max 400 vysledku))
  ![GoFinderFinish](https://user-images.githubusercontent.com/3242659/218745235-3d1b58e2-30d7-4f4b-8eeb-807b49750aaf.png)
  
- kliknete kamkoli (do volne potemnele plochy)

- a na nasledujici strance se vygeneruji vysledky filtrace
  - pokud se jedna o prvni spusteni vyhledavani searchstringu pres snippet, zobrazi se vsechny linky, ktere odpovidaji vstupnim parametrum (velikost od-do + exclude strings) - ty doporucuji procist ( jsou razeny abecedne, jsou nacteny vsechny na jedne strance, takze je mozne i vyhledavat pomoci Ctrl+F)
  - casove mnohem nenarocnejsi je druhe ( ci n-te) vyhledavani searchstringu za stejnych vstupnich parametru - to uz se seznam zcvrkne na nekolik polozek, ktere snadno prolitnete ocima - nebot dodava pouze rozdily oproti predchozimu hledani
  ![goFinderGenerated](https://user-images.githubusercontent.com/3242659/218747264-4a4b69f4-e020-482a-a4ea-4251c9b404d2.png)
  
  
**Vstupni parametry**  
ze screenshotu je videt, ze mam ulozeny script trikrat - jen s ruznymi vstupnimi parametry
![GoFinderSnippets](https://user-images.githubusercontent.com/3242659/218749864-b42d510d-48f2-4257-b059-eca562cf0792.png)
- Archives (search string je bud zip,rar nebo 7z) s velikosti od 150MB do 1.5GB, s vyloucenim vsech nazvu typu "zip.0","7z.0",".part"...
- Audiokniha  (search string je "audiokniha") s velikosti od 100MB do 2GB , s vyloucenim vsech nazvu typu ".mp4" - mam k nim urcitou aversi - ani nevim proc
- mp3 (search string je "audiokniha") s velikosti od 40MB do 1GB

**_pri prepisovani parametru mente jenom hodnoty, syntaxe musi byt zachovana_**

jednotlive parametry:
- ``var minSize = '100MB';``

  minimalni velikost souboru, ktery bude zarazen do vygenerovaneho vystupu
  > priklad: 100kB, 1.5GB (pozor, musi byt tecka jako desetinny oddelovac)
- ``var maxSize = '1.25GB';``  

  maximalni velikost souboru, ktery bude zarazen do vygenerovaneho vystupu
  > povolene jednotky: GB(gigaBytes), MB(megaBytes), KB(kiloBytes), B(Bytes)
- ``var excludestr = ['.part', '.log', 'The ', 'The.', 'Various', 'VA -', '.avi', '.mkv', '.ts', '.mp4', 'FLAC', 'zip.0', '7z.0'];``
  seznam retezcu, ktere se nesmi vyskytovat ve vysledcich hledani 
  > pokud hledate pres archivy, dostane se do vysledku hledani dmnoho balastu - je mozne odfiltrovat nektere soubory
- ``var gofinderlink = 'https://entry.gozofinder.com/redirect/';``  
  tento parametr jsem zaradila, protoze GozoFinder se dost casto meni - predtim byl ``https://entry.gozofinder.com/redirect-hash/``
- ``var ascrolltimeout = 100;``
- ``var ascrollsize = 250;``
  na techto dvou parametrech zalezi rychlost automatickeho rolovani 
  s nastavenim timeoutu je mozne si pohrat - nicmene plati, ze vsechny linky musi byt vykresleny ( jinak nebudou zahrnuty do vysledku hledani - nevykreslene linky - sede obdelniky
  obdobne si lze pohrat i velikosti posunu scrolovani - plati to same jako pro timeout -
  cim mensi timeout (mel by byt urcite > 10ms) a cim vetsi scrollsize, tim rychleji se odroluji vsechny linky vyhovujici "search" -
  nicmene je treba vzit v potaz rychlost pripojeni, pocitace atd, aby nedoslo k tomu, ze se linky neprokresli - viz vyse
  rolovani je nutny kvuli pagovani GozoFinder - nacte max. 30 linku a postupne umazava ty, ktere odrolovaly nahoru -

  
 **localStorage**
 
 localStorage ma bohuzel omezenou kapacitu (v Chrome 5MB), ktera u nekterych browseru nelze zmenit (napr.Chrome)
Pri hrozbe prekroceni tohoto limitu pri ukladani vysledku se na pocatku rolovani objevi moznost promazani ulozenych vysledku v localStorage.
(vysledky jsou ukladany ve tvaru ``searchstring_minSize_maxSize`` 
![localstoragefull](https://user-images.githubusercontent.com/3242659/218758981-34aa13cb-2018-48da-9810-46423df0f798.png)

jak je z obr.patrne, abonenty na smazani jsou zridka vyhledavane terminy, popr. ty, jejichz velikost (vpravo) neni prilis velka - coz znaci, ze seznam neni prilis dlouhy a da se procist rychle.

Pokud jste si jisti, ze vysledek hledani se do localStorage vejde ( existujici filter je prepsan, takze velikost LocalStorage se prilis nezmeni), nemusite oznacovat nic



**Poznamka**
- script neni dokonaly, ale setri cas.
- Captcha je typu google-recaptcha a i kdyz existuji navody, jak se zbavit toho otravneho klikani (plugin do Chrome, ci koupit si API key na Recaptcha a obejit ho - tak ani jeden mi neprisel idealni)
- Captcha je neprijemna, protoze pri jejim zobrazeni obcas utece par linku, ktere se nenactou - ty se pak objevi mezi chybejicimi - aby v nasledujicim spusteni scriptu se zaradily mezi nove - proto je vyhodne po zadani searchstringu provest take refresh stranky (v opacnem pripade se pocet linku scita a captcha otravuje  )






 

  


