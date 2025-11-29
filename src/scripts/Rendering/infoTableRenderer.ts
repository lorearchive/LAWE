// AffiliTable.ts
interface AffiliTableProps {
    name: string;
    school: string;
}

const clubMemberList: Record<string, string[]> = {

    schale: ["sensei", "arona"],
    schale1: ["sensei", "arona", "plana"],

    gsc: ["president", "rin", "momoka", "ayumu", "kaya", "aoi", "sumomo", "haine"],

    ftf: ["shiroko", "hoshino", "nonomi", "serika", "ayane"],

    prefect: ["hina", "ako", "iori", "chinatsu"],
    gematria: ["black_suit", "beatrice", "maestro"],
    pandemonium: ["makoto", "satsuki", "iroha", "chiaki", "ibuki"],
    "68": ["aru", "kayoko", "mutsuki", "haruka"],

    seminar: ["yuuka", "noa", "rio", "koyuki"],
    gdd: ["yuzu", "momoi", "midori", "aris"],
    "c&c": [],

    tea: ["nagisa", "mika", "seia"],
    makeup: ["hifumi", "azusa", "hanako", "koharu"],
    sisterhood: ["sakurako", "mari", "hinata"],
    justice: ["tsurugi", "hasumi", "mashiro", "ichika"],
    
    rabbit: ["miyako", "saki", "moe", "miyu"],
    fox: ["yukino", "niko", "kurumi", "otogi"],
    
    ccc: ["hikari&nozomi", "hikari&nozomi"],
    hso: ["suou"]
};


const personFullName: Record<string, string> = {
    shiroko: "Sunaookami Shiroko",
    serika: "Kuromi Serika",
    hoshino: "Takanashi Hoshino",
    nonomi: "Izayoi Nonomi",
    ayane: "Okusora Ayane",
    arona: "Arona",
    hina: "Sorasaki Hina",
    ako: "Amau Ako",
    iori: "Shiromi Iori",
    chinatsu: "Hinomiya Chinatsu",
    aru: "Rikuhachima Aru",
    kayoko: "Onikata Kayoko",
    mutsuki: "Asagi Mutsuki",
    haruka: "Igusa Haruka",
    hifumi: "Ajitani Hifumi",
    yuuka: "Hayase Yuuka",
    izuna: "Kuda Izuna",
    azusa: "Shirasu Azusa",
    momoi: "Saiba Momoi",
    midori: "Saiba Midori",
    aris: "Tendou Aris",
    mari: "Iochi Mari",
    makoto: "Hanuma Makoto",
    kirara: "Yozakura Kirara",
    izumi: "Shishidou Izumi",
    rio: "Tsukatsuki Rio",
    noa: "Ushio Noa",
    koyuki: "Kurosaki Koyuki",
    seia: "Yurizono Seia"
};
export function renderAffiliTable({ name, school }: AffiliTableProps): string {
    const schoolCode: Record<string, string> = {
        abydos: "Abydos High School",
        gehenna: "Gehenna Academy",
        trinity: "Trinity General School",
        arius: "Arius Branch School",
        millennium: "Millennium Science School",
        hyakkiyako: "Allied Hyakkiyako Academy",
        shanhaijing: "Shanhaijing Senior Secondary School",
        valkyrie: "Valkyrie Police School",
        red_winter: "Red Winter Federal Academy",
        srt: "SRT Special Academy",
        highlander: "Highlander Railroad Academy",
        gematria: "Gematria"
    };

    const schoolFullName = schoolCode[school] ?? "";
    
    const clubCode: Record<string, string> = {
        schale: "S.C.H.A.L.E",
        schale1: "S.C.H.A.L.E",
        gsc: "General Student Council",
        ftf: "Foreclosure Task Force",
        seminar: "Seminar"
    };

    

    

    const club = Object.entries(clubMemberList).find(([_, members]) => members.includes(name))?.[0] ?? null;
    
    if (!club) {
        throw new Error("LAWE AFFILI TABLE RENDERING: CLUB not found for student " + name);
    }

    const members = clubMemberList[club];
    const memberListItems = members.map(member => 
        `<li class="border-b p-2">
            <a>${personFullName[member] || member}</a>
            
        </li>`
    ).join('');


    return `
        <table id="lawe-infoTable" class="affili">
            <thead class="thead-no-style">
                <tr>
                    <th id="lawe-infoTable-th" class="pretitle" colspan="2">A member of<br /><h3 class="h3-no-spacing"><a href="/wiki/setting/${school}">${schoolFullName}</a></h3></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td id="lawe-infoTable-school-cell" class="no-spacing" colspan="2">
                        <figure id="lawe-figure" class="figure-no-style">
                            <a id="lawe-figure-a" class="a-no-style" href="/wiki/setting/academies/${school}">
                                <img src="https://raw.githubusercontent.com/lorearchive/law-content/main/images/icons/${school}.png" width="100" alt="The logo of ${schoolFullName}." loading="lazy" />
                            </a>
                        </figure>
                    </td>
                </tr>
                <tr>
                    <td class="center" colspan="2">
                        <div id="clubMemberList">
                            <h3>${clubCode[club] || club}</h3>
                            <div class="max-w-xs flex flex-col border-r border-t border-l border-gray-500 rounded-md">
                                <ul>
                                    ${memberListItems}
                                </ul>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    `
}

export function renderInfoTable({ name, figure, caption, alias, affiliation, clubs, halo }: { name: string; figure?: string; caption: string; alias: string; affiliation?: string; clubs?: string; halo?: string }) {    return `
    <table id="lawe-infoTable" class="infoTable">
        <thead>
            <tr>
                <th id="lawe-infoTable" class="pretitle" colspan="2">
                    <div class="title-wrap">
                        <span class="title-line1">${personFullName[name].split(" ")[0]}</span>
                        <span class="title-line2"><h3 class="h3-no-spacing">${personFullName[name].split(" ")[1]}</h3></span>
                    </div>
                </th>
            </tr>
            <tr>
                <td>
                    <figcaption class="figcaption-no-style">${caption}</figcaption>
                </td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th id="lawe-infoTable-label">Other names</th>
                <td>${alias?.split("\\\\").map(s => s.trim()).join("<br />")}</td>
            </tr>
            <tr>
                <th id="lawe-infoTable-label">Affiliation</th>
                <td>${affiliation}</td>
            </tr>
        </tbody>
    </table>`
}