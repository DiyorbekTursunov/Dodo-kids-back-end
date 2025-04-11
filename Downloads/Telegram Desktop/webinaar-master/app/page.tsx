import Image from "next/image"
import { ModalButton } from "@/components/modal-button"
import "./globals.css"
import "./modal.css"

export default function Home() {
  return (
    <section className="home" style={{ backgroundImage: `url("/images/bg.webp")` }}>
      <div className="homeContainer">
        <div className="homeCard maxLgHidden">
          <div className="homeCardTop">
            <Image
              src={"/images/homeLeftBig.webp"}
              alt="Speaker"
              width={255}
              height={320}
              className="homeCardTopImgBig"
            />
            <Image
              src="/images/homeLeftMini.webp"
              alt="Speaker"
              width={207}
              height={235}
              className="homeCardTopImgMini"
            />
            <Image src={"/images/arrow.svg"} alt="arrow" className="arrow" width={80} height={120} />
          </div>
          <p className="homeCardText">
          Bu — Dostonjon Soyibov, yillik aylanmasi 12.3 mlrd $ bo&apos;lgan tadbirkorlar uchun mo&apos;ljallangan Buyuk Zamon kompaniyasining asoschisi. U 5 kun oldin o&apos;zini &quot;nolga qaytarishga&quot; qaror qiladi. Hammasini 0 dan boshlaydi.
          </p>
        </div>
        <div className="homeCenter">
          <div className="homeCenterTop">
            <p className="logo">Buyuk Zamon</p>
            <p className="homeCenterTopText">
              <span className="homeCenterTopTextRound"></span>15-apreldan
            </p>
            <p className="homeCenterText_md">
              Reality-Show Dostonjon Soyibov bilan
              <span className="homeCenterTopTextInfo">i</span>
            </p>
          </div>
          <p className="homeCenterText">
            Reality-Show Dostonjon Soyibov bilan
            <span className="homeCenterTopTextInfo">i</span>
          </p>
          <h1 className="homeCenterTitle">
            Qilichbek <br /> Qishloqda
          </h1>

          <p className="homeCenterInfoText">
            Milliarder hech qanday tanish-bilishsiz, pul yoki o&apos;z ismimdan foydalanmagan holda noldan pul topa oladimi?
          </p>
          <div className="mobileCenterCenter">
            <div className="homeCard">
              <div className="homeCardTop">
                <Image
                  src={"/images/homeLeftBig.webp"}
                  alt="Speaker"
                  width={255}
                  height={320}
                  className="homeCardTopImgBig"
                />
                <Image
                  src="/images/homeLeftMini.webp"
                  alt="Speaker"
                  width={207}
                  height={235}
                  className="homeCardTopImgMini"
                />
                <Image src={"/images/arrow.svg"} alt="arrow" className="arrow" width={80} height={120} />
              </div>
              <p className="homeCardText">
                Bu — Dostonjon Soyibov, yillik aylanmasi 12.3 mlrd $ bo&apos;lgan tadbirkorlar uchun mo&apos;ljallangan Buyuk Zamon kompaniyasining asoschisi. U 5 kun oldin o&apos;zini &quot;nolga qaytarishga&quot; qaror qiladi. Hammasini 0 dan boshlaydi.
              </p>
            </div>
            <div className="homeCard">
              <div className="homeCardTop">
                <Image
                  src={"/images/homeRightBig.webp"}
                  alt="Speaker"
                  width={207}
                  height={235}
                  className="homeCardTopImgRightMini"
                />
                <Image
                  src="/images/homeRightMini.webp"
                  alt="Speaker"
                  width={236}
                  height={320}
                  className="homeCardTopImgRightBig"
                />
              </div>
              <ul className="homeRightList">
                <li className="homeRightListItem">U Toshkentdagi uyidan chiqib, qishloqdagi oddiy kvartiraga ko‘chib o‘tadi.</li>
                <li className="homeRightListItem">U o‘z hisoblaridagi pullardan voz kechadi.</li>
                <li className="homeRightListItem">Ismini va tashqi ko‘rinishini o‘zgartiradi.</li>
              </ul>
            </div>
          </div>
          <p className="homeCenterInfoTextBottom">
            Dostonjon Soyibov shaxsiy misolida noldan biznes boshlash mumkinligini va bir hafta ichida qancha daromad topish mumkinligini ko&apos;rsatadi. Tomosha qiling va uning ortidan takrorlang!
          </p>

          <ModalButton />
        </div>
        <div className="homeCard maxLgHidden">
          <div className="homeCardTop">
            <Image
              src={"/images/homeRightBig.webp"}
              alt="Speaker"
              width={207}
              height={235}
              className="homeCardTopImgRightMini"
            />
            <Image
              src="/images/homeRightMini.webp"
              alt="Speaker"
              width={236}
              height={320}
              className="homeCardTopImgRightBig"
            />
          </div>
          <ul className="homeRightList">
            <li className="homeRightListItem">U Toshkentdagi uyidan chiqib, qishloqdagi oddiy kvartiraga ko‘chib o‘tadi.</li>
            <li className="homeRightListItem">U o‘z hisoblaridagi pullardan voz kechadi.</li>
            <li className="homeRightListItem">Ismini va tashqi ko‘rinishini o‘zgartiradi.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
