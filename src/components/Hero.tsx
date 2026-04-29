import { ArrowRight, Phone, Calendar, CheckCircle } from 'lucide-react';

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="pt-20 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* LEFT SIDE */}
          <div className="space-y-8">
            <div className="inline-block">
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                Professional Tech Solutions
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              SHINESTAR CYBER
              <span className="block text-blue-600 mt-2">COMPUTERS</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Transform your business with cutting-edge cyber services, government applications, and IT solutions. We deliver excellence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="tel:0743181585"
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg"
              >
                <Phone className="w-5 h-5" />
                <span className="font-semibold">Call Now</span>
              </a>

              <button
                onClick={() => scrollToSection('contact')}
                className="flex items-center justify-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-lg border-2 border-blue-600 hover:bg-gray-50 transition-all duration-200 shadow-lg"
              >
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">Book Appointment</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">Trusted by 1000+ clients</span>
            </div>
          </div>

          {/* RIGHT SIDE CARDS */}
          <div className="grid grid-cols-2 gap-6">

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600 font-medium">Success Rate</div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mt-8">
              <div className="text-4xl font-bold text-blue-600 mb-2">4+</div>
              <div className="text-gray-600 font-medium">Years Excellence</div>
            </div>

            {/* PHONE NUMBERS CARD */}
       <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
  <div className="space-y-2">

    <div>
      <span className="text-blue-600 text-xl font-bold">Safaricom:</span>{" "}
      <span className="text-black text-base font-semibold">0743181585</span>
    </div>

    <div>
      <span className="text-blue-600 text-xl font-bold">Airtel:</span>{" "}
      <span className="text-black text-base font-semibold">0731715382</span>
    </div>

  </div>

  <div className="text-gray-600 font-medium mt-3">Call Anytime</div>
</div>

            {/* WORKING HOURS CARD */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mt-8">
              <div className="text-2xl font-bold text-blue-600 mb-2">Mon-Sat</div>
              <div className="text-gray-600 font-medium">7:00 AM - 9:00 PM</div>

              <div className="text-2xl font-bold text-blue-600 mt-4 mb-2">Sunday</div>
              <div className="text-gray-600 font-medium">1:30 PM - 9:00 PM</div>
            </div>

          </div>
        </div>

        {/* BOTTOM STATS */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">Makueni</div>
            <div className="text-sm text-gray-600 mt-1">Mtito-Andei, next to KCB</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">1000+</div>
            <div className="text-sm text-gray-600 mt-1">Happy Clients</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">2000+</div>
            <div className="text-sm text-gray-600 mt-1">Services Completed</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">24/7</div>
            <div className="text-sm text-gray-600 mt-1">Support Available</div>
          </div>
        </div>
      </div>
    </section>
  );
}