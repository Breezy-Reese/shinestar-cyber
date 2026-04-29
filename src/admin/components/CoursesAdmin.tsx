import React, { useEffect, useState } from "react";
import api from "../../utils/api";

interface Course {
  _id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  price_ksh?: number;
  createdAt: string;
}

const CoursesAdmin: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    level: "basic",
    price_ksh: ""
  });

  // ================= FETCH COURSES =================
  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // ================= CREATE COURSE =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/courses", {
        ...form,
        price_ksh: Number(form.price_ksh)
      });

      setForm({
        title: "",
        description: "",
        duration: "",
        level: "basic",
        price_ksh: ""
      });

      fetchCourses();
    } catch (err) {
      console.error("Error creating course:", err);
    }
  };

  // ================= DELETE COURSE =================
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    } catch (err) {
      console.error("Error deleting course:", err);
    }
  };

  if (loading) {
    return <div className="p-6">Loading courses...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Courses</h1>

      {/* ================= FORM ================= */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 shadow rounded space-y-3"
      >
        <input
          className="border p-2 w-full"
          placeholder="Course Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          placeholder="Duration (e.g 3 months)"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          placeholder="Price (KSH)"
          type="number"
          value={form.price_ksh}
          onChange={(e) => setForm({ ...form, price_ksh: e.target.value })}
        />

        <select
          className="border p-2 w-full"
          value={form.level}
          onChange={(e) => setForm({ ...form, level: e.target.value })}
        >
          <option value="basic">Basic</option>
          <option value="advanced">Advanced</option>
          <option value="professional">Professional</option>
        </select>

        <button className="bg-indigo-600 text-white px-4 py-2 rounded">
          Create Course
        </button>
      </form>

      {/* ================= LIST ================= */}
      <div className="mt-6 grid gap-4">
        {courses.map((course) => (
          <div key={course._id} className="border p-4 rounded bg-white">
            <h2 className="font-bold text-lg">{course.title}</h2>
            <p className="text-gray-600">{course.description}</p>

            <div className="text-sm mt-2">
              <p>⏱ Duration: {course.duration}</p>
              <p>📊 Level: {course.level}</p>
              {course.price_ksh && <p>💰 KSH {course.price_ksh}</p>}
            </div>

            <button
              onClick={() => handleDelete(course._id)}
              className="mt-3 bg-red-600 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesAdmin;