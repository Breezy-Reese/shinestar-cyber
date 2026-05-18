import { Target, Eye, Award, Users, Zap, ShieldCheck } from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: Target,
      title: 'Excellence',
      description: 'We strive for perfection in every service we deliver',
      color: 'bg-blue-500'
    },
    {
      icon: ShieldCheck,
      title: 'Integrity',
      description: 'Trust and transparency in all our client relationships',
      color: 'bg-green-500'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Embracing the latest technology for better solutions',
      color: 'bg-purple-500'
    },
    {
      icon: Users,
      title: 'Customer Focus',
      description: 'Your satisfaction is our top priority',
      color: 'bg-orange-500'
    }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            About SHINESTAR CYBER COMPUTERS AND TECH SOLUTIONS KENYA
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your trusted partner in technology and business solutions
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <img
              src="https://images.pexels.com/photos/3184433/pexels-photo-3184433.jpeg"
              alt="About SHINESTAR CYBER COMPUTERS AND TECH SOLUTIONS KENYA"
              className="rounded-2xl shadow-2xl"
            />
          </div>

          <div className="space-y-6">
            <div>
              <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                Since 2018
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">n
                Building Success Through Technology
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                SHINESTAR CYBER COMPUTERS AND TECH SOLUTIONS KENYA has been serving the Mtito-Andei community for over 6 years, providing comprehensive technology solutions, government service assistance, and professional training programs.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Located in Mtito-Andei we've become the go-to destination for individuals and businesses seeking reliable, professional, and efficient services.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our team of experienced professionals is committed to delivering excellence in every interaction, ensuring that your needs are met with precision and care.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600 mb-1">70,000+</div>
                <div className="text-gray-700 font-medium">Happy Clients</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600 mb-1">120,000+</div>
                <div className="text-gray-700 font-medium">Services Delivered</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              To be the leading technology and business solutions provider in Kenya, empowering individuals and organizations through innovative services, expert guidance, and unwavering commitment to excellence.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              To deliver exceptional technology solutions and government services with professionalism, integrity, and efficiency. We aim to simplify complex processes and empower our clients to achieve their goals.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Core Values
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 text-center"
                >
                  <div className={`inline-flex p-4 rounded-full ${value.color} bg-opacity-10 mb-4`}>
                    <Icon className={`w-8 h-8 ${value.color.replace('bg-', 'text-')}`} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {value.title}
                  </h4>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <Award className="w-16 h-16 mx-auto mb-6" />
          <h3 className="text-3xl font-bold mb-4">Certified & Trusted</h3>
          <p className="text-xl text-blue-50 max-w-2xl mx-auto mb-6">
            We maintain the highest standards of service quality and professionalism, backed by industry certifications and thousands of satisfied clients.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">ISO Certified</span>
            <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">Government Approved</span>
            <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">Industry Leader</span>
            <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">5-Star Rated</span>
          </div>
        </div>
      </div>
    </section>
  );
}
