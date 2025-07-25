// AffiliTable.ts
interface AffiliTableProps {
    name: string;
    school: string;
}

export function renderAffiliTable({ name, school }: AffiliTableProps): string {
    const schoolCode: Record<string, string> = {
        abyd: "Abydos High School",
        gehn: "Gehenna Academy",
        trin: "Trinity General School",
        ariu: "Arius Branch School",
        mill: "Millennium Science School",
        hyak: "Allied Hyakkiyako Academy",
        shan: "Shanhaijing Senior Secondary School",
        valk: "Valkyrie Police School",
        redw: "Red Winter Federal Academy",
        srt: "SRT Special Academy",
        rail: "Highlander Railroad Academy",
        gema: "Gematria"
    };

    const schoolFullName = schoolCode[school] ?? "";
    
    const clubCode: Record<string, string> = {
        schale: "S.C.H.A.L.E",
        schale1: "S.C.H.A.L.E",
        gsc: "General Student Council",
        ftf: "Foreclosure Task Force"
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
    };

    const clubMemberList: Record<string, string[]> = {
        ftf: ["shiroko", "hoshino", "nonomi", "serika", "ayane"],
        schale: ["sensei", "arona"],
        schale1: ["sensei", "arona", "plana"],
        gsc: ["president", "rin", "momoka", "ayumu", "kaya", "aoi", "sumomo", "haine"],
        gema: ["black_suit", "beatrice", "maestro"],
        pande: ["makoto", "satsuki", "iroha", "chiaki", "ibuki"],
        prefect: ["hina", "ako", "iori", "chinatsu"],
        "68": ["aru", "kayoko", "mutsuki", "haruka"],
        seminar: ["yuuka", "noa", "rio", "koyuki"],
        gdd: ["yuzu", "momoi", "midori", "aris"],
        tea: ["nagisa", "mika", "seia"],
        makeup: ["hifumi", "azusa", "hanako", "koharu"],
        sister: ["sakurako", "mari", "hinata"],
        justice: ["tsurugi", "hasumi", "mashiro", "ichika"],
        rabbit: ["miyako", "saki", "moe", "miyu"],
        fox: ["yukino", "niko", "kurumi", "otogi"],
        ccc: ["hikari&nozomi", "hikari&nozomi"],
        hso: ["suou"]
    };

    const club = Object.entries(clubMemberList).find(([_, members]) => members.includes(name))?.[0] ?? null;
    
    if (!club) {
        throw new Error("LAWE AFFILI TABLE RENDERING: CLUB not found for student " + name);
    }

    const members = clubMemberList[club];
    const memberListItems = members.map(member => 
        `<li>
            <a>${personFullName[member] || member}</a>
            
        </li>`
    ).join('');


    return `
        <table id="lawe-infoTable" class="affili">
            <thead class="thead-no-style">
                <tr>
                    <th id="lawe-infoTable-th" colspan="2">A member of</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td id="lawe-infoTable-school-cell" colspan="2">
                        <strong>${schoolFullName}</strong>
                    </td>
                </tr>
                <tr>
                    <td class="center" colspan="2">
                        <div id="clubMemberList">
                            <h3>${clubCode[club] || club}</h3>
                            <div class="max-w-xs flex flex-col border border-gray-500 rounded-md">
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