import Navbar from "../../components/navbar/Navbar";

export default function Blog() {

  return (
    <div className="bg-[#FBFBFB] md:bg-white font-sans">
      {/* Header */}
      <Navbar />

      {/* Blog Content */}
      <div className="max-w-[590px] mx-auto py-10 px-5">
        {/* Blog Header */}
        <h1 className="text-[40px] font-medium text-gray-800 pb-10 border-b-[1px] border-gray-200 mb-10">
          Blog
        </h1>

        <div className="flex-col md:flex md:flex-row justify-between">
          <p className="mb-5 md:text-[16px] text-gray-600">8 iyun 2025</p>

          {/* Blog Post */}
          <div className="max-w-[362px]">
            {/* Featured Image/Icon */}
            <div className="bg-blue-500 rounded-[16px] flex items-center justify-center px-[140px] py-[70px] mb-5">
              <div className="text-white text-6xl">
                <svg
                  width="83"
                  height="100"
                  viewBox="0 0 83 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.2273 74.168L7.62162 64.626L25.4246 47.4891H0V33.9923H24.9769L7.62162 17.0435L17.0354 7.56408L34.3167 24.5559V0H48.7046V24.2941L66.0925 7.62677L75.6029 16.8554L58.215 33.8988L83 34.0869V47.4571L60.4249 47.3637L75.5916 64.6051L65.9859 73.98L41.4994 51.6319"
                    fill="#F7F8F8"
                  />
                  <path
                    d="M34.1989 67.6084H48.8012V100H34.1989V68.0792"
                    fill="#F7F8F8"
                  />
                </svg>
              </div>
            </div>

            {/* Main Title */}
            <h2 className="text-[28px] font-bold text-gray-900 mb-2">
              Mobbin is SOC 2 compliant
            </h2>

            {/* Main Content */}
            <p className="text-gray-600 text-[12px] leading-relaxed mb-4">
              We're excited to share that Mobbin is now SOC 2 Type II compliant.
              Over the past year, our team spent considerable effort to tighten
              control and visibility of our data and processes with the help of
              the SOC 2 framework.
            </p>

            {/* Subheading 1 */}
            <h3 className="text-[20px] font-semibold text-gray-900 mb-2">
              What is SOC 2?
            </h3>

            {/* Content 1 */}
            <p className="text-gray-600 text-[12px] leading-relaxed mb-4">
              We're excited to share that Mobbin is now SOC 2 Type II compliant.
              Over the past year, our team spent considerable effort to tighten
              control and visibility of our data and processes with the help of
              the SOC 2 framework.
            </p>

            {/* Subheading 2 */}
            <h3 className="text-[20px] font-semibold text-gray-900 mb-2">
              What is SOC 2?
            </h3>

            {/* Content 2 */}
            <p className="text-gray-600 text-[12px] leading-relaxed mb-4">
              We're excited to share that Mobbin is now SOC 2 Type II compliant.
              Over the past year, our team spent considerable effort to tighten
              control and visibility of our data and processes with the help of
              the SOC 2 framework.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
