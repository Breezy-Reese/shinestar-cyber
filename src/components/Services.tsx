import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { X, CheckCircle, Send } from 'lucide-react';
import api from '../admin/utils/api';

interface Service {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  price_ksh?: number;
  featured?: boolean;
  createdAt: string;
}

type FieldDef = { name: string; label: string; type: string; required: boolean; placeholder?: string; options?: string[] };

const CATEGORY_FIELDS: Record<string, FieldDef[]> = {
  'Government Services': [
    { name: 'fullName',    label: 'Full Name',         type: 'text',     required: true,  placeholder: 'As on National ID' },
    { name: 'idNumber',    label: 'ID Number',         type: 'text',     required: true,  placeholder: 'e.g. 12345678' },
    { name: 'phone',       label: 'Phone Number',      type: 'tel',      required: true,  placeholder: '07XXXXXXXX' },
    { name: 'email',       label: 'Email Address',     type: 'email',    required: false, placeholder: 'Optional' },
    { name: 'requirement', label: 'What do you need?', type: 'textarea', required: true,  placeholder: 'Describe your specific requirement...' },
  ],
  'Immigration Services': [
    { name: 'fullName',    label: 'Full Name',            type: 'text',   required: true,  placeholder: 'As on passport/ID' },
    { name: 'idNumber',    label: 'ID / Passport Number', type: 'text',   required: true,  placeholder: 'e.g. A1234567' },
    { name: 'phone',       label: 'Phone Number',         type: 'tel',    required: true,  placeholder: '07XXXXXXXX' },
    { name: 'email',       label: 'Email Address',        type: 'email',  required: true,  placeholder: 'your@email.com' },
    { name: 'destination', label: 'Travel Destination',   type: 'text',   required: false, placeholder: 'Country / Region' },
    { name: 'urgency',     label: 'Urgency',              type: 'select', required: true,  options: ['Normal (1-2 weeks)', 'Urgent (2-3 days)', 'Same Day'] },
  ],
  'Tax Services': [
    { name: 'fullName',       label: 'Full Name',       type: 'text',   required: true,  placeholder: 'As on KRA records' },
    { name: 'kraPin',         label: 'KRA PIN',         type: 'text',   required: true,  placeholder: 'e.g. A123456789Z' },
    { name: 'phone',          label: 'Phone Number',    type: 'tel',    required: true,  placeholder: '07XXXXXXXX' },
    { name: 'email',          label: 'Email Address',   type: 'email',  required: true,  placeholder: 'your@email.com' },
    { name: 'taxYear',        label: 'Tax Year',        type: 'text',   required: true,  placeholder: 'e.g. 2023' },
    { name: 'employmentType', label: 'Employment Type', type: 'select', required: true,  options: ['Employed', 'Self-Employed', 'Both', 'Unemployed'] },
  ],
  'Vehicle Services': [
    { name: 'fullName',    label: 'Full Name',          type: 'text', required: true,  placeholder: 'Vehicle owner name' },
    { name: 'phone',       label: 'Phone Number',       type: 'tel',  required: true,  placeholder: '07XXXXXXXX' },
    { name: 'numberPlate', label: 'Number Plate',       type: 'text', required: true,  placeholder: 'e.g. KAA 123B' },
    { name: 'vehicleInfo', label: 'Vehicle Make/Model', type: 'text', required: false, placeholder: 'e.g. Toyota Fielder 2015' },
  ],
  'Education Services': [
    { name: 'fullName',    label: 'Full Name',            type: 'text',   required: true,  placeholder: 'Your full name' },
    { name: 'phone',       label: 'Phone Number',         type: 'tel',    required: true,  placeholder: '07XXXXXXXX' },
    { name: 'email',       label: 'Email Address',        type: 'email',  required: true,  placeholder: 'your@email.com' },
    { name: 'institution', label: 'Institution / School', type: 'text',   required: true,  placeholder: 'Your school or university' },
    { name: 'indexNumber', label: 'Index / Reg Number',   type: 'text',   required: false, placeholder: 'Optional' },
  ],
  'Business Services': [
    { name: 'fullName',     label: 'Full Name',         type: 'text',     required: true,  placeholder: 'Contact person' },
    { name: 'businessName', label: 'Business Name',     type: 'text',     required: true,  placeholder: 'Registered business name' },
    { name: 'phone',        label: 'Phone Number',      type: 'tel',      required: true,  placeholder: '07XXXXXXXX' },
    { name: 'email',        label: 'Email Address',     type: 'email',    required: true,  placeholder: 'your@email.com' },
    { name: 'description',  label: 'What do you need?', type: 'textarea', required: true,  placeholder: 'Describe your business requirement...' },
  ],
  'Printing Services': [
    { name: 'fullName',    label: 'Full Name',          type: 'text',     required: true,  placeholder: 'Your name' },
    { name: 'phone',       label: 'Phone Number',       type: 'tel',      required: true,  placeholder: '07XXXXXXXX' },
    { name: 'description', label: 'What do you need?',  type: 'textarea', required: true,  placeholder: 'Describe the printing job...' },
    { name: 'quantity',    label: 'Quantity / Copies',  type: 'text',     required: false, placeholder: 'e.g. 50 copies' },
    { name: 'format',      label: 'Preferred Format',   type: 'select',   required: false, options: ['Hard Copy', 'Soft Copy (PDF)', 'Both'] },
  ],
  'Design Services': [
    { name: 'fullName',    label: 'Full Name',          type: 'text',     required: true,  placeholder: 'Your name' },
    { name: 'phone',       label: 'Phone Number',       type: 'tel',      required: true,  placeholder: '07XXXXXXXX' },
    { name: 'description', label: 'What do you need?',  type: 'textarea', required: true,  placeholder: 'Describe the design work...' },
    { name: 'quantity',    label: 'Quantity / Copies',  type: 'text',     required: false, placeholder: 'e.g. 100 pieces' },
    { name: 'format',      label: 'Preferred Format',   type: 'select',   required: false, options: ['Hard Copy', 'Soft Copy (PDF)', 'Both'] },
  ],
  'Digital Services': [
    { name: 'fullName',    label: 'Full Name',          type: 'text',     required: true,  placeholder: 'Your name' },
    { name: 'phone',       label: 'Phone Number',       type: 'tel',      required: true,  placeholder: '07XXXXXXXX' },
    { name: 'description', label: 'What do you need?',  type: 'textarea', required: true,  placeholder: 'Describe what you need scanned or converted...' },
    { name: 'quantity',    label: 'Number of Pages',    type: 'text',     required: false, placeholder: 'e.g. 10 pages' },
  ],
  'Health Insurance': [
    { name: 'fullName',  label: 'Full Name',     type: 'text',  required: true,  placeholder: 'As on ID' },
    { name: 'idNumber',  label: 'ID Number',     type: 'text',  required: true,  placeholder: 'e.g. 12345678' },
    { name: 'phone',     label: 'Phone Number',  type: 'tel',   required: true,  placeholder: '07XXXXXXXX' },
    { name: 'email',     label: 'Email Address', type: 'email', required: false, placeholder: 'Optional' },
    { name: 'employer',  label: 'Employer Name', type: 'text',  required: false, placeholder: 'Your employer or company' },
  ],
  'Social Security': [
    { name: 'fullName',  label: 'Full Name',     type: 'text',  required: true,  placeholder: 'As on ID' },
    { name: 'idNumber',  label: 'ID Number',     type: 'text',  required: true,  placeholder: 'e.g. 12345678' },
    { name: 'phone',     label: 'Phone Number',  type: 'tel',   required: true,  placeholder: '07XXXXXXXX' },
    { name: 'email',     label: 'Email Address', type: 'email', required: false, placeholder: 'Optional' },
    { name: 'employer',  label: 'Employer Name', type: 'text',  required: false, placeholder: 'Your employer or company' },
  ],
};

const DEFAULT_FIELDS: FieldDef[] = [
  { name: 'fullName',    label: 'Full Name',          type: 'text',     required: true,  placeholder: 'Your full name' },
  { name: 'phone',       label: 'Phone Number',       type: 'tel',      required: true,  placeholder: '07XXXXXXXX' },
  { name: 'email',       label: 'Email Address',      type: 'email',    required: false, placeholder: 'Optional' },
  { name: 'description', label: 'What do you need?',  type: 'textarea', required: true,  placeholder: 'Describe your requirement...' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; light: string }> = {
  'Government Services':  { bg: 'bg-blue-600',    text: 'text-blue-600',   light: 'bg-blue-50' },
  'Immigration Services': { bg: 'bg-purple-600',  text: 'text-purple-600', light: 'bg-purple-50' },
  'Tax Services':         { bg: 'bg-red-600',      text: 'text-red-600',    light: 'bg-red-50' },
  'Vehicle Services':     { bg: 'bg-orange-500',  text: 'text-orange-500', light: 'bg-orange-50' },
  'Education Services':   { bg: 'bg-green-600',   text: 'text-green-600',  light: 'bg-green-50' },
  'Business Services':    { bg: 'bg-indigo-600',  text: 'text-indigo-600', light: 'bg-indigo-50' },
  'Printing Services':    { bg: 'bg-yellow-500',  text: 'text-yellow-600', light: 'bg-yellow-50' },
  'Design Services':      { bg: 'bg-pink-500',    text: 'text-pink-600',   light: 'bg-pink-50' },
  'Digital Services':     { bg: 'bg-cyan-500',    text: 'text-cyan-600',   light: 'bg-cyan-50' },
  'Health Insurance':     { bg: 'bg-teal-600',    text: 'text-teal-600',   light: 'bg-teal-50' },
  'Social Security':      { bg: 'bg-emerald-600', text: 'text-emerald-600',light: 'bg-emerald-50' },
};

const getColor = (category: string) =>
  CATEGORY_COLORS[category] || { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' };

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.FileText;
    return Icon;
  };

  const getFields = (category: string): FieldDef[] =>
    CATEGORY_FIELDS[category] || DEFAULT_FIELDS;

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setFormData({});
    setSuccess(false);
    setError('');
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedService) return;
    const fields = getFields(selectedService.category);

    for (const field of fields) {
      if (field.required && !formData[field.name]?.trim()) {
        setError(`${field.label} is required.`);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const details = fields
        .map(f => `${f.label}: ${formData[f.name] || 'N/A'}`)
        .join('\n');

      await api.post('/bookings', {
        fullName: formData.fullName || formData.businessName || 'Unknown',
        phoneNumber: formData.phone,
        clientEmail: formData.email || '',
        service: selectedService._id,
        preferredDate: new Date().toISOString(),
        additionalNotes: details,
      });

      setSuccess(true);
      setTimeout(() => {
        setSelectedService(null);
        setSuccess(false);
        setFormData({});
      }, 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedService(null);
    setSuccess(false);
    setError('');
    setFormData({});
  };

  if (loading) {
    return (
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Our Expertise</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Premium Services — Click any service to get started
            </p>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No services available at the moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => {
                const Icon = getIcon(service.icon);
                const color = getColor(service.category);
                return (
                  <button
                    key={service._id}
                    onClick={() => handleServiceClick(service)}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 text-left group w-full"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${color.light} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${color.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xl font-bold text-gray-900 mb-2 group-hover:${color.text} transition-colors`}>
                          {service.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {service.category}
                          </span>
                          {service.price_ksh && (
                            <span className={`${color.text} font-bold text-sm`}>
                              KSH {service.price_ksh.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className={`mt-3 text-xs font-semibold ${color.text} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1`}>
                          <span>Click to request this service</span>
                          <Icons.ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom banner */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4">Government Services Hub</h3>
                <p className="text-blue-50 text-lg leading-relaxed">
                  Complete assistance with eCitizen, KRA, NTSA, and all government portals. Fast, reliable, and professional service guaranteed.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Icons.ShieldCheck, label: 'Secure', sub: '100% Safe' },
                  { icon: Icons.Zap,         label: 'Fast',   sub: 'Same Day' },
                  { icon: Icons.Award,       label: 'Quality',sub: 'Premium' },
                  { icon: Icons.Users,       label: 'Support',sub: '24/7 Help' },
                ].map(({ icon: Ico, label, sub }) => (
                  <div key={label} className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                    <Ico className="w-8 h-8 mb-2" />
                    <div className="font-bold text-lg">{label}</div>
                    <div className="text-sm text-blue-50">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Inquiry Modal ─────────────────────────────────────────── */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4 py-6"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className={`${getColor(selectedService.category).bg} px-6 py-5 rounded-t-2xl flex justify-between items-start`}>
              <div>
                <p className="text-white text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">
                  {selectedService.category}
                </p>
                <h3 className="text-lg font-bold text-white">{selectedService.title}</h3>
                <p className="text-white text-sm opacity-80 mt-1">{selectedService.description}</p>
              </div>
              <button onClick={closeModal} className="text-white hover:opacity-70 ml-4 flex-shrink-0">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {success ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h4>
                  <p className="text-gray-600 text-sm">
                    Your request for <strong>{selectedService.title}</strong> has been received.
                    We'll contact you shortly.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-5">
                    Fill in your details and we'll get back to you as soon as possible.
                  </p>
                  <div className="space-y-4">
                    {getFields(selectedService.category).map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={formData[field.name] || ''}
                            onChange={e => handleChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formData[field.name] || ''}
                            onChange={e => handleChange(field.name, e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                          >
                            <option value="">Select...</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={formData[field.name] || ''}
                            onChange={e => handleChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className={`flex-1 px-4 py-3 ${getColor(selectedService.category).bg} text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center space-x-2 text-sm hover:opacity-90 transition-opacity`}
                    >
                      {submitting ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>Submitting...</span></>
                      ) : (
                        <><Send className="w-4 h-4" /><span>Submit Request</span></>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
