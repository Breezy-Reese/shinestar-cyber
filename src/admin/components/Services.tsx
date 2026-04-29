import React, { useState, useEffect } from 'react';
import api from '../utils/api';

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

const CATEGORIES = [
  'Government Services',
  'Education Services',
  'Immigration Services',
  'Vehicle Services',
  'Health Insurance',
  'Social Security',
  'Business Services',
  'Tax Services',
  'Printing Services',
  'Design Services',
  'Digital Services',
  'Other',
];

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    icon: '',
    price_ksh: '',
    featured: false,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setErrorMsg('Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingService ? prev.slug : generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...formData,
        price_ksh: formData.price_ksh ? Number(formData.price_ksh) : undefined,
      };
      if (editingService) {
        await api.put(`/services/${editingService._id}`, payload);
        setSuccessMsg('Service updated successfully!');
      } else {
        await api.post('/services', payload);
        setSuccessMsg('Service created successfully!');
      }
      fetchServices();
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error saving service:', error);
      setErrorMsg('Failed to save service. Please try again.');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      slug: service.slug,
      description: service.description,
      category: service.category,
      icon: service.icon || '',
      price_ksh: service.price_ksh ? String(service.price_ksh) : '',
      featured: service.featured || false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await api.delete(`/services/${id}`);
        setSuccessMsg('Service deleted successfully!');
        fetchServices();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error('Error deleting service:', error);
        setErrorMsg('Failed to delete service.');
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({ title: '', slug: '', description: '', category: '', icon: '', price_ksh: '', featured: false });
    setErrorMsg('');
  };

  const filtered = services.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory ? s.category === filterCategory : true;
    return matchSearch && matchCategory;
  });

  const categories = [...new Set(services.map((s) => s.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-500 mt-1">{services.length} services total</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow"
        >
          + Add Service
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Passport Application"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="passport-application"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Icon (Lucide name)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. FileText, Shield, Printer"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price (KSH)</label>
                <input
                  type="number"
                  value={formData.price_ksh}
                  onChange={(e) => setFormData({ ...formData, price_ksh: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 500"
                  min="0"
                />
              </div>

              {/* Featured */}
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 text-sm font-semibold text-gray-700">
                  Mark as Featured
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe what this service offers..."
                required
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
              >
                {editingService ? 'Update Service' : 'Create Service'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Services Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Featured</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((service) => (
              <tr key={service._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">{service.title}</div>
                  <div className="text-xs text-gray-400">{service.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                    {service.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {service.price_ksh ? `KSH ${service.price_ksh.toLocaleString()}` : '—'}
                </td>
                <td className="px-6 py-4">
                  {service.featured ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">Yes</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500 font-medium">No</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(service)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service._id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No services found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
