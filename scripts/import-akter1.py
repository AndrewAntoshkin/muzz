#!/usr/bin/env python3
"""Download akter1.ru roster photos and emit faces data for assets/faces.js."""

from __future__ import annotations

import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "actors" / "akter1"
DATA_JS = ROOT / "assets" / "akter1-faces.js"

ACTORS = [
    ("Агеев Роман", "ageev-roman", "https://akter1.ru/media/zoo/images/okoshko_6b230af01868b08ac2353bc872df350b.jpg"),
    ("Безруков Сергей", "bezrukov-sergej", "https://akter1.ru/media/zoo/images/ms20_0e41ae3c3ded77b349008bd081bce8a5.png"),
    ("Беляев Сергей", "belyaev-sergej", "https://akter1.ru/media/zoo/images/ms19_bf40ee1ced0883396735da43b051a2dc.png"),
    ("Большов Владимир", "bolshov-vladimir", "https://akter1.ru/media/zoo/images/16_725fe06473d2d00271fbb90295be0464.jpg"),
    ("Вардеванян Арам", "vardevanyan-aram", "https://akter1.ru/media/zoo/images/okoshko_f6f5b88b79917b5f8061ff6bbb195bbc.jpeg"),
    ("Варущенко Алексей", "varushchenko-aleksej", "https://akter1.ru/media/zoo/images/dsc_6824-_cut_photo-ru_d9d0141d21829f3e593829e63497aaea.jpeg"),
    ("Гордин Игорь", "gordin-igor", "https://akter1.ru/media/zoo/images/img_2557_kopiya_cut_photo-ru_fb5a7879a8cfa18cb9e57014db9a9753.jpg"),
    ("Добронравов Виктор", "dobronravov-viktor", "https://akter1.ru/media/zoo/images/6_50fc71f2f2c0734f511756e1c631b553.jpg"),
    ("Добронравов Федор", "dobronravov-fedor", "https://akter1.ru/media/zoo/images/mg4_992ef8cf8a9e6234495dda1054c62e0e.png"),
    ("Емцов Андрей", "emcov-andrej", "https://akter1.ru/media/zoo/images/img_0167_cut_photo-ru_94603df24edf5b6fc8fe592eb96b38ef.jpg"),
    ("Жарков Сергей", "zharkov-sergej", "https://akter1.ru/media/zoo/images/okoshko_2_614fe40743ed5e9674be098bb2f39dd5.jpg"),
    ("Кокин Даниил", "kokin-daniil", "https://akter1.ru/media/zoo/images/okoshko_cut_photo-ru_94866478add4257c0271b5dfa44eb5c9.jpg"),
    ("Косырев Евгений", "kosyrev-evgenij", "https://akter1.ru/media/zoo/images/okoshko_d2479939fcfdf7c10ab1b858570b06ff.jpg"),
    ("Крылов Виталий", "krylov-vitalij", "https://akter1.ru/media/zoo/images/glavnoe_foto_fd1ad2e9ae5034b35108b0a88ff12684.jpg"),
    ("Кузнецов Кирилл", "kuznecov-kirill", "https://akter1.ru/media/zoo/images/okoshko_cut_photo-ru_a0b7587b7341f1414697b64e1547dcbc.jpg"),
    ("Лакшин Иван", "lakshin-ivan", "https://akter1.ru/media/zoo/images/okoshko_7d0aab815e678a4ec9a041a2b85f5603.jpeg"),
    ("Лапин Иван", "lapin-ivan", "https://akter1.ru/media/zoo/images/lapin_ivan_iyuny_2025_9_cut_photo-ru_97f5f2e48b9f26935574fd90edf2a16f.jpg"),
    ("Марин Сергей", "marin-sergej", "https://akter1.ru/media/zoo/images/tor_0659-_cut_photo-ru_3253bfb9206ccde15cf3fa1ceb83c2a1.jpeg"),
    ("Мартынов Андрей", "martynov-andrej", "https://akter1.ru/media/zoo/images/okoshko_2ec33793a473ee91d129dcac9bb44fb9.jpg"),
    ("Метелкин Александр", "metelkin-aleksandr", "https://akter1.ru/media/zoo/images/okoshko_novoe_cut_photo-ru_328bff3a47bf303015c3347da904590a.jpg"),
    ("Муляр Дмитрий", "mulyar-dmitrij", "https://akter1.ru/media/zoo/images/okoshko_923dcf30fecd8db14b5905688d343a99.jpg"),
    ("Насонов Юрий", "nasonov-yurij", "https://akter1.ru/media/zoo/images/image_1fa3bb27ec03130561cba390c8b1e491.jpg"),
    ("Радойичич Александр", "radojchich-aleksandr", "https://akter1.ru/media/zoo/images/okoshko_3c0c978dcc1bdcc6107715e4ec96c5a1.jpeg"),
    ("Савинков Павел", "savinkov-pavel", "https://akter1.ru/media/zoo/images/24_5f2289d147f568f266aec9599950daf7.jpg"),
    ("Санников Евгений", "sannikov-evgenij", "https://akter1.ru/media/zoo/images/okoshko_81f6d0db2bdcf878bcd2cb957af786d9.jpg"),
    ("Синявский Денис", "sinyavskij-denis", "https://akter1.ru/media/zoo/images/img_0503_2_cut_photo-ru_9d538ae1cc5887ac864cf4299f8a3ccd.jpg"),
    ("Ткаченко Артем", "tkachenko-artem", "https://akter1.ru/media/zoo/images/8_24cc847a4025d63ea011ca654b2ab413.jpg"),
    ("Тополянский Олег", "topolyanskij-oleg", "https://akter1.ru/media/zoo/images/60_0fc4c012fc68fe6803453305858e8e85.jpg"),
    ("Трибунцев Тимофей", "tribuncev-timofej", "https://akter1.ru/media/zoo/images/ms4_5ee0bd68304d0ed0fc3fde01c480e4df.png"),
    ("Трухин Михаил", "truhin-mihail", "https://akter1.ru/media/zoo/images/photo1714643775_bb7eda319363fbb0da9d99f732ae106a.jpeg"),
    ("Тяптушкин Владимир", "tyaptushkin-vladimir", "https://akter1.ru/media/zoo/images/okoshko_cut_photo-ru_e7d6c1525cd9f733303254539729ec08.jpg"),
    ("Устюгов Александр", "ustyugov-aleksandr", "https://akter1.ru/media/zoo/images/okoshko_3_57dc511def549c9fe1ef66ee1895691f.jpg"),
    ("Феоктистов Антон", "feoktistov-anton", "https://akter1.ru/media/zoo/images/okoshko_1_74d25c956e191d68807469f06932ed4a.jpg"),
    ("Хориняк Виктор", "horinyak-viktor", "https://akter1.ru/media/zoo/images/ms2_84368099f29b4f2acd6ed68bed6c48c0.png"),
    ("Цокуров Юрий", "cokurov-yurij", "https://akter1.ru/media/zoo/images/okoshko_cut_photo-ru_a1a31a08081d323739330c7c1f5afc8d.jpg"),
    ("Чадов Алексей", "chadov-aleksej", "https://akter1.ru/media/zoo/images/photo1714553584_1e612118c84c96c4fe5be8128b209b00.jpeg"),
    ("Шакунов Илья", "shakunov-ilya", "https://akter1.ru/media/zoo/images/okoshko-_cut_photo-ru_1_5bcdb82e5c445cd32b03500f6b90d29c.jpg"),
    ("Якин Александр", "yakin-aleksandr", "https://akter1.ru/media/zoo/images/32_ead92cfe70d78a22649027f09f357f00.jpg"),
]

ACTRESSES = [
    ("Антонова Анна", "antonova-anna", "https://akter1.ru/media/zoo/images/antonova_anna_avg_2024_111_cut_photo-ru_0d4b912ed7f65782c4aa1b403eb23515.jpg"),
    ("Ахметзянова Мария", "ahmetzyanova-mariya", "https://akter1.ru/media/zoo/images/123_6ab3cfff05829b53d47a792f9ceb6d6b.jpg"),
    ("Баханкова Любовь", "bahankova-lyubov", "https://akter1.ru/media/zoo/images/ms22_1683981bb9aa4302d9dd86feeda3d04b.png"),
    ("Большова Мария", "bolshova-mariya", "https://akter1.ru/media/zoo/images/okoshko_d9129e244372280281fa2f6700f26649.jpg"),
    ("Вдовина Наталия", "vdovina-nataliya", "https://akter1.ru/media/zoo/images/4_3cd12382f7d0b31981cc573418f935ef.jpg"),
    ("Завтур Анна", "zavtur-anna", "https://akter1.ru/media/zoo/images/anna_zavtur_23-_cut_photo-ru_7fedb06c90eb3c587672fbc9458c8e4f.jpeg"),
    ("Иванова Марина", "ivanova-marina", "https://akter1.ru/media/zoo/images/tor_0440_cut_photo-ru_91573772f5ce8695ee0e50a26f444f99.jpg"),
    ("Кекеева Эльвира", "kekeeva-elvira", "https://akter1.ru/media/zoo/images/90_51a658a81a7e67ce02d5f99fd01f83b5.jpg"),
    ("Киося Екатерина", "kiosya-ekaterina", "https://akter1.ru/media/zoo/images/okoshko_1_6468fd03bd5c6c29e6a8eff68f3ce968.jpeg"),
    ("Ковалева Юлия", "kovaleva-yuliya", "https://akter1.ru/media/zoo/images/okoshko_5fefe69dee2c64b13aaefbba03661143.jpg"),
    ("Колпакова Светлана", "kolpakova-svetlana", "https://akter1.ru/media/zoo/images/okoshko_7ebd677c1d3e8fb024113c15eb5c950d.jpg"),
    ("Коняшкина Марина", "konyashkina-marina", "https://akter1.ru/media/zoo/images/602a6536_2_copy_i_cut_photo-ru_42ef8d2cba0559317f3b874847c3bb86.jpg"),
    ("Курдюбова Наталия", "kurdyubova-nataliya", "https://akter1.ru/media/zoo/images/17_4afba3ed26521a96d79864a8aeaf388f.jpg"),
    ("Кутепова Полина", "kutepova-polina", "https://akter1.ru/media/zoo/images/10_9e6fc083c4c5dcc3115b461ff1f0c2cf.jpg"),
    ("Лерман Ольга", "lerman-olga", "https://akter1.ru/media/zoo/images/mg2_a97a2f4a157240aa18fd770370410344.png"),
    ("Лисина Екатерина", "lisina-ekaterina", "https://akter1.ru/media/zoo/images/okoshko_36c3c1579bd3185713348cb11a1655af.jpg"),
    ("Лопунова София", "lopunova-sofiya", "https://akter1.ru/media/zoo/images/glavnaya_cut_photo-ru_ffe39f58da3d82e1b5fb708b65b8d1fe.jpg"),
    ("Максакова Людмила", "maksakova-lyudmila", "https://akter1.ru/media/zoo/images/68_f54d629e6900d04a8d75b65ce10a9879.jpg"),
    ("Махова Елена", "mahova-elena", "https://akter1.ru/media/zoo/images/elem_2fd83730049aeb06de08e21a9aced7b3.jpg"),
    ("Меньшова Юля", "menshova-yulya", "https://akter1.ru/media/zoo/images/ms10_955ae6a37398aa25fe994067d53da90a.png"),
    ("Муравьева Елена", "muraveva-elena", "https://akter1.ru/media/zoo/images/64_79ab435bc065e94f5e39ec6d15bb5db3.jpg"),
    ("Насонова Кира", "nasonova-kira", "https://akter1.ru/media/zoo/images/nasonova_kira_iyuny_26_5_cut_photo-ru_5f2b13ca273e7fd17920cced5be26a81.jpg"),
    ("Николаева Софья", "nikolaeva-sofya", "https://akter1.ru/media/zoo/images/okoshko_ef273d54856ec8ae30a34ff10673f92b.jpeg"),
    ("Нифонтова Лика", "nifontova-lika", "https://akter1.ru/media/zoo/images/okoshko_df70ec82af975a7a0f9d063a13aa211c.jpg"),
    ("Панова Елена", "panova-elena", "https://akter1.ru/media/zoo/images/okoshko_09d3e3025863198da78ce285766c8f31.jpg"),
    ("Пегова Ирина", "pegova-irina", "https://akter1.ru/media/zoo/images/okoshko_1_4cf3ebc5dc622449ddf40362a4989029.jpg"),
    ("Радулович Милена", "radulovich-milena", "https://akter1.ru/media/zoo/images/okoshko_dffaf0092c758b02feed66c30912a9b1.jpeg"),
    ("Рахманова Ирина", "rahmanova-irina", "https://akter1.ru/media/zoo/images/photo_2024_09_19_08-49-54-_cut_photo-ru_29046e24883256448f8eeae328f21ca6.jpeg"),
    ("Руденок Дарья", "rudenok-darya", "https://akter1.ru/media/zoo/images/okoshko_27cef1ad2daf01daec12e83ecd567de3.jpg"),
    ("Рычкова Наталья", "rychkova-natalya", "https://akter1.ru/media/zoo/images/nv6a7175-_cut_photo-ru_75521748d571f03af97598e908635721.jpeg"),
    ("Савицкая Мария", "savickaya-mariya", "https://akter1.ru/media/zoo/images/dsc_1973_cut_photo-ru_b3a5c62769331ef526fb3c0578774c7b.jpg"),
    ("Семёнова Алёна", "semenova-alena", "https://akter1.ru/media/zoo/images/okoshko_cb656501ae5682b0eff24da8f0ce290f.jpg"),
    ("Тенякова Ольга", "tenyakova-olga", "https://akter1.ru/media/zoo/images/ms7_6fa76629658d5618ff7c881345cd8115.png"),
    ("Теплова Ксения", "teplova-kseniya", "https://akter1.ru/media/zoo/images/ms6_5cd7fab32d30f2a830ba96d8fbc77f73.png"),
    ("Урсуляк Дарья", "ursulyak-darya", "https://akter1.ru/media/zoo/images/ursulyak_daryya_sent_2024_40_cut_photo-ru_fbd8f5a6f41c03a2bccde35b400c0c6e.jpg"),
    ("Фаттахова Олеся", "fattahova-olesya", "https://akter1.ru/media/zoo/images/okoshko_682afec961c745a36cce7d122efac382.jpg"),
    ("Хмельницкая Алёна", "hmelnickaya-alyona", "https://akter1.ru/media/zoo/images/13_f72c575049b961268d96987bd01cc143.jpg"),
    ("Цигаль-Полищук Мариэтта", "cigal-polishchuk-marietta", "https://akter1.ru/media/zoo/images/602a0416_59_cut_photo-ru_e9ee62d007f4099175515fec98e40ff1.jpg"),
    ("Шиловская Аглая", "shilovskaya-aglaya", "https://akter1.ru/media/zoo/images/okoshko_a6a737557baf2b13d081293444f023eb.jpg"),
    ("Шкиль Анна", "shkil-anna", "https://akter1.ru/media/zoo/images/okoshko-_cut_photo-ru_e05fdf36523c3d48e217a580d9bb1b25.jpeg"),
]


def given_first(name: str) -> str:
    parts = name.split()
    if len(parts) < 2:
        return name
    return f"{parts[-1]} {' '.join(parts[:-1])}"


def ext_of(url: str) -> str:
    suffix = Path(url.split("?", 1)[0]).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp"} else ".jpg"


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Referer": "https://akter1.ru/",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            dest.write_bytes(resp.read())
        return dest.stat().st_size > 0
    except Exception as exc:
        print(f"FAIL {url}: {exc}")
        if dest.exists():
            dest.unlink()
        return False


def card(name: str, slug: str, photo: str, profession: str, role: str, local: bool) -> dict:
    dest = OUT_DIR / f"{slug}{ext_of(photo)}"
    img = f"assets/actors/akter1/{dest.name}" if local and dest.exists() else photo
    href = "profile.html" if profession == "actor" else "profile-actress.html"
    return {
        "href": href,
        "name": given_first(name),
        "role": role,
        "profession": profession,
        "city": "Москва",
        "img": img,
        "verified": True,
        "hint": "Агентство «Актёр 1»",
        "slug": slug,
    }


def write_faces(local: bool) -> list[dict]:
    faces = [card(*row, "actor", "Актёр", local) for row in ACTORS]
    faces += [card(*row, "actress", "Актриса", local) for row in ACTRESSES]
    faces.sort(key=lambda x: x["name"])
    payload = json.dumps(faces, ensure_ascii=False, indent=2)
    DATA_JS.write_text(
        "/** Roster from https://akter1.ru — generated by scripts/import-akter1.py */\n"
        f"window.AKTER1_FACES = {payload};\n",
        encoding="utf-8",
    )
    return faces


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_faces(local=False)
    jobs = []
    for name, slug, photo in ACTORS + ACTRESSES:
        jobs.append((photo, OUT_DIR / f"{slug}{ext_of(photo)}"))
    ok = 0
    with ThreadPoolExecutor(max_workers=12) as pool:
        futs = {pool.submit(download, url, dest): dest for url, dest in jobs}
        for fut in as_completed(futs):
            if fut.result():
                ok += 1
    faces = write_faces(local=True)
    print(f"wrote {len(faces)} faces, {ok} local photos → {DATA_JS}")


if __name__ == "__main__":
    main()
