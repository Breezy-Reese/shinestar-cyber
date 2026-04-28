import { useState } from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 3000);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-2">Stay Ahead of the Curve</h3>
              <p className="text-blue-50 text-lg">
                Subscribe to receive exclusive updates on government services, tech tips, and special offers
              </p>
            </div>
            <div>
              {subscribed ? (
                <div className="bg-white rounded-lg p-4 flex items-center space-x-3 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">Successfully subscribed!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="flex-1 px-6 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold flex items-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Subscribe</span>
                  </button>
                </form>
              )}
              <p className="text-blue-50 text-sm mt-3">
                Join 5,000+ subscribers. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  S
                </div>
                <div>
                  <h3 className="text-xl font-bold">SHINESTAR COMPUTERS</h3>
                  <p className="text-sm text-gray-400">AND TECH SOLUTIONS KENYA</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Professional cyber services and technology solutions for individuals and businesses in Kenya.
              </p>
              <div className="space-y-2">
                <a href="tel:0743181585" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>0743181585</span>
                </a>
                <a href="mailto:shinestarcybercomputerservices254@gmail.com" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>shinestarcomputerservices254@gmail.com</span>
                </a>
                <div className="flex items-center space-x-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>Makueni, Mtito-Andei next to KCB</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4">Services</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('services')} className="text-gray-400 hover:text-white transition-colors">
                    Computer Repair
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('services')} className="text-gray-400 hover:text-white transition-colors">
                    Software Solutions
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('services')} className="text-gray-400 hover:text-white transition-colors">
                    Networking
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('courses')} className="text-gray-400 hover:text-white transition-colors">
                    Training Courses
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-white transition-colors">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('contact')} className="text-gray-400 hover:text-white transition-colors">
                    Contact
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('gallery')} className="text-gray-400 hover:text-white transition-colors">
                    Gallery
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('courses')} className="text-gray-400 hover:text-white transition-colors">
                    Courses
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('contact')} className="text-gray-400 hover:text-white transition-colors">
                    Help Center
                  </button>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 SHINESTAR CYBER COMPUTERS AND TECH SOLUTIONS KENYA. All rights reserved.
            </p>

            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">Follow Us</span>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-200"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors duration-200"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors duration-200"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-500 mb-1">5K+</div>
                <div className="text-sm text-gray-400">Subscribers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500 mb-1">Weekly</div>
                <div className="text-sm text-gray-400">Updates</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500 mb-1">100%</div>
                <div className="text-sm text-gray-400">Free</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500 mb-1">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
