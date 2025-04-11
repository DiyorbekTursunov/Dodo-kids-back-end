"use client"


import Image from "next/image";
import "../modal.css";
import { useEffect, useState } from "react";

export default function ThankYouPage() {
  const [fillWidth, setFillWidth] = useState("0%");

  useEffect(() => {
    setFillWidth("88%");
  }, []);
  return (
    <div className="thank-you-page">
      <div className="thank-you-content">
        <div className="thank-you-left">
          <div className="thank-you-header">
            <div className="header-left">
              <p className="logo">Buyuk Zamon</p>
              <div className="header-date">
                <span className="date-dot"></span>
                <span>15-apreldan</span>
              </div>
            </div>
            <div className="header-right">
              <div className="header-show-info">
                Reality-Show Dostonjon Soyibov bilan
                <span className="info-icon">i</span>
              </div>
            </div>
          </div>
          <h1 className="thank-you-title">Ro&apos;yxatdan o&apos;tishingiz <br /> deyarli yakunlandi</h1>
          <p className="thank-you-subtitle">Oxirgi qadam qoldi</p>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: fillWidth }}></div>
            <span className="progress-text">90%</span>
          </div>

          <div className="thank-you-right mdHidden">
            <div className="image-collage">
              <div className="collage-image collage-image-1">
                <Image
                  src={"/images/homeLeftBig.webp"}
                  alt="Аяз в комнате"
                  width={400}
                  height={400}
                  className="rounded-image"
                />
              </div>
              <div className="collage-image collage-image-2">
                <Image
                  src="/images/homeLeftMini.webp"
                  alt="Аяз с машиной"
                  width={300}
                  height={300}
                  className="rounded-image"
                />
              </div>
              <div className="collage-image collage-image-3">
                <Image
                  src={"/images/homeRightBig.webp"}
                  alt="Аяз с фургоном"
                  width={350}
                  height={350}
                  className="rounded-image"
                />
              </div>
            </div>
          </div>

          <div className="telegram-box">
            <p className="telegram-text">
              Butun jarayondan xabardor bo&apos;lish uchun Telegram kanalga obuna bo&apos;ling
            </p>
            <div className="arrow-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="74"
                height="74"
                viewBox="0 0 74 205"
                fill="none"
              >
                <g clipPath="url(#clip0_4293_49)">
                  <mask
                    id="mask0_4293_49"
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="74"
                    height="205"
                  >
                    <path d="M74 0H0V205H74V0Z" fill="white" />
                  </mask>
                  <g mask="url(#mask0_4293_49)">
                    <path
                      d="M70.5204 132.859C70.0754 134.477 69.3068 138.226 67.8774 142.339C67.5403 143.377 67.2032 144.442 66.8661 145.521C66.529 146.6 66.0703 147.638 65.6793 148.69C64.8432 150.767 64.1825 152.843 63.36 154.569C56.5637 170.832 45.9782 185.651 32.3317 196.749C30.1337 198.408 26.5605 201.401 24.7535 198.934C22.8792 196.358 23.9444 193.054 27.3695 190.276C35.4738 183.264 42.9984 175.12 48.1091 165.586C51.7904 158.628 55.1749 151.535 57.737 144.118C60.3125 136.715 62.2545 129.097 63.2793 121.343C64.1963 114.371 64.3849 107.346 64.1017 100.347C63.7106 93.3487 62.524 86.4178 60.7845 79.635C59.7866 76.4931 58.937 73.3105 57.6425 70.2899C57.0087 68.7662 56.4964 67.2156 55.7817 65.7323L53.6781 61.2823C50.6845 55.4434 47.4348 49.7394 43.6591 44.3859C40.5306 39.6798 37.038 35.2163 33.4376 30.8203L30.579 27.6651C29.6081 26.6268 28.7044 25.521 27.6526 24.5636C25.5895 22.6083 23.6073 20.5451 21.3554 18.7921C20.3171 17.9426 19.0763 17.1202 17.8222 16.2976C16.5142 15.529 15.166 14.7873 13.9793 13.9378C12.0645 12.441 8.54504 10.472 6.61674 8.98871C5.79417 8.32796 4.87722 7.76169 3.9198 7.38412C-0.462707 5.75247 -1.12358 4.17486 1.77563 1.74762C2.42289 1.22172 2.4768 0.115765 3.77133 0.183188C3.82527 0.183188 3.93303 0.183188 3.98696 0.183188C6.07709 0.0483426 7.88422 0.641943 9.5698 1.47799C11.2014 2.40843 12.7118 3.58128 14.3569 4.52521C30.3497 14.0858 43.8611 27.5978 53.9207 43.2669C60.0562 52.9354 64.6951 63.4802 68.2821 74.3758C68.7405 75.8726 69.4146 77.3156 69.8192 78.8528C70.2507 80.3766 70.6418 81.9138 70.8575 83.505L70.844 83.451C71.3025 85.0556 71.5992 86.7009 71.9093 88.3461C72.206 89.9912 72.5568 91.6362 72.7456 93.2948C74.1075 105.889 73.5814 119.266 70.844 131.079C70.7226 131.524 70.6822 132.171 70.5204 132.859Z"
                      fill="#EE404D"
                    />
                    <path
                      d="M36.4961 193.797C37.5614 193.594 41.3372 192.853 43.67 192.043C49.0909 190.236 54.2553 187.944 59.6761 185.841C60.5257 185.504 61.8203 184.708 63.4519 187.283C65.151 189.953 65.1916 192.138 63.6274 192.934C59.8247 194.835 55.7793 196.048 52.1249 198.085C46.7446 201.132 40.636 202.359 34.6354 203.478C33.2869 203.748 31.9114 203.924 30.5495 204.085L28.4863 204.288C27.7311 204.355 26.9491 204.382 26.14 204.369C24.5218 204.342 22.8091 204.193 20.8673 203.505C19.9503 203.182 18.7772 202.588 17.8737 201.833C16.9567 201.078 16.1747 200.148 15.6084 199.096C15.069 198.112 14.7049 197.019 14.5565 195.887C14.3947 194.714 14.4486 193.702 14.543 192.785C14.7723 190.951 15.2579 189.454 15.7434 188.106L16.4578 186.272L17.1455 184.559C17.6174 183.427 18.103 182.294 18.6424 181.188C20.4898 177.372 23.0115 173.893 25.0881 170.185C25.5736 169.308 25.5871 167.987 26.0995 167.016C26.531 166.22 27.1918 164.858 27.8121 164.171C28.0818 163.874 28.3919 163.564 28.4458 163.186C28.729 161.393 29.9156 161.447 32.8148 163.47C33.4486 163.915 34.4194 164.211 34.716 164.818C34.7295 164.845 34.7565 164.899 34.77 164.912C36.132 166.976 34.6892 167.731 34.1633 168.944C31.6012 174.891 28.8369 180.757 26.1535 186.65L24.8992 189.347C24.4811 190.25 24.0228 191.167 23.7127 191.922C23.389 192.691 23.1733 193.419 23.0924 193.999C23.0655 194.282 23.052 194.538 23.0924 194.7C23.1329 194.821 23.1731 194.862 23.2406 194.929C23.3215 194.983 23.4698 194.997 23.5777 194.97C23.6856 194.956 23.7126 194.929 23.6587 195.064C23.7531 195.051 23.7261 194.97 23.9688 194.997C24.1576 195.01 24.4409 195.024 24.7375 195.091C25.3308 195.199 26.1128 195.226 26.9624 195.172C27.7445 195.132 28.9179 194.956 29.9022 194.862C31.9384 194.579 33.961 194.295 35.8894 194.039C36.1051 194.012 36.2803 193.837 36.4961 193.797Z"
                      fill="#EE404D"
                    />
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_4293_49">
                    <rect width="74" height="205" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>

          <a
            href="https://t.me/channel"
            target="_blank"
            rel="noopener noreferrer"
            className="subscribe-button"
          >
            Obuna bo&apos;lish
          </a>
        </div>

        <div className="thank-you-right maxMdHidden">
          <div className="image-collage">
            <div className="collage-image collage-image-1">
              <Image
                src={"/images/homeLeftBig.webp"}
                alt="Аяз в комнате"
                width={400}
                height={400}
                className="rounded-image"
              />
            </div>
            <div className="collage-image collage-image-2">
              <Image
                src="/images/homeLeftMini.webp"
                alt="Аяз с машиной"
                width={300}
                height={300}
                className="rounded-image"
              />
            </div>
            <div className="collage-image collage-image-3">
              <Image
                src={"/images/homeRightBig.webp"}
                alt="Аяз с фургоном"
                width={350}
                height={350}
                className="rounded-image"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
