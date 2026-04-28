import { Image, Award, Users, TrendingUp } from 'lucide-react';

export default function Gallery() {
  const stats = [
    {
      icon: Users,
      value: '70,000+',
      label: 'Happy Clients',
      color: 'bg-blue-500'
    },
    {
      icon: Award,
      value: '120,000+',
      label: 'Services Completed',
      color: 'bg-green-500'
    },
    {
      icon: TrendingUp,
      value: '99.9%',
      label: 'Success Rate',
      color: 'bg-purple-500'
    },
    {
      icon: Image,
      value: '12+',
      label: 'Years Experience',
      color: 'bg-orange-500'
    }
  ];

  const highlights = [
    {
      title: 'State-of-the-Art Equipment',
      description: 'Modern computers and printing technology for high-quality service delivery',
      image: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg'
    },
    {
      title: 'Professional Team',
      description: 'Experienced staff ready to assist with all your tech and government service needs',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'
    },
    {
      title: 'Prime Location',
      description: 'Conveniently located in Kisumu, California next to Oasis',
      image: 'https://images.pexels.com/photos/2883049/pexels-photo-2883049.jpeg'
    },
    {
      title: 'Quality Output',
      description: 'Professional printing, design, and document processing services',
      image: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg'
    }
  ];

  return (
    <section id="gallery" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Our Excellence in Action
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Witness the quality and professionalism that makes us the preferred choice
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`inline-flex p-3 rounded-lg ${stat.color} bg-opacity-10 mb-4`}>
                  <Icon className={`w-8 h-8 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-64 overflow-hidden">
                <img
                  src={highlight.image}
                  alt={highlight.title}
                  className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {highlight.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {highlight.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">Visit Our Modern Facility</h3>
          <p className="text-xl text-blue-50 mb-6 max-w-2xl mx-auto">
            Experience our professional environment equipped with the latest technology to serve you better
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:0743181585"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold shadow-lg"
            >
              Call to Schedule Visit
            </a>
            <button
              onClick={() => {
                const element = document.getElementById('contact');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200 font-semibold"
            >
              Get Directions
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
