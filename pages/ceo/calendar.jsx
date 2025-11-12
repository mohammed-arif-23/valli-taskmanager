import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export default function CEOCalendar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [showMobileTodoView, setShowMobileTodoView] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    priority: 'medium',
    category: 'task',
    notes: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ceo') {
      toast.error('Access denied - CEO only');
      router.push('/');
      return;
    }

    setUser(parsedUser);
    fetchTodos(token);
  }, [currentDate]);

  const fetchTodos = async (token) => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const res = await fetch(`/api/ceo/calendar?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setTodos(data.todos || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      const filtered = todos.filter((todo) => {
        const todoDate = new Date(todo.date);
        return (
          todoDate.getDate() === selectedDate.getDate() &&
          todoDate.getMonth() === selectedDate.getMonth() &&
          todoDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      setFilteredTodos(filtered);
    }
  }, [selectedDate, todos]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getTodosForDate = (date) => {
    return todos.filter((todo) => {
      const todoDate = new Date(todo.date);
      return (
        todoDate.getDate() === date.getDate() &&
        todoDate.getMonth() === date.getMonth() &&
        todoDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setSelectedTodos([]);

    // Show mobile view on small screens
    if (window.innerWidth < 1024) {
      setShowMobileTodoView(true);
    }
  };

  const handleCreateTodo = () => {
    setEditingTodo(null);
    const dateToUse = selectedDate || new Date();
    setFormData({
      title: '',
      description: '',
      date: formatDateForInput(dateToUse),
      start_time: '',
      end_time: '',
      priority: 'medium',
      category: 'task',
      notes: '',
    });
    setShowTodoModal(true);
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    const todoDate = new Date(todo.date);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      date: formatDateForInput(todoDate),
      start_time: todo.start_time || '',
      end_time: todo.end_time || '',
      priority: todo.priority,
      category: todo.category,
      notes: todo.notes || '',
    });
    setShowTodoModal(true);
  };

  const handleSubmitTodo = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');

    try {
      const url = editingTodo ? `/api/ceo/calendar/${editingTodo._id}` : '/api/ceo/calendar';
      const method = editingTodo ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingTodo ? 'Todo updated!' : 'Todo created!');
        setShowTodoModal(false);
        await fetchTodos(token);

        // Update selected date to show the newly created todo
        if (formData.date) {
          const createdDate = new Date(formData.date);
          setSelectedDate(createdDate);
        }
      } else {
        const data = await res.json();
        toast.error(data.error?.message || 'Failed to save todo');
      }
    } catch (error) {
      toast.error('Failed to save todo');
    }
  };

  const handleToggleComplete = async (todo) => {
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`/api/ceo/calendar/${todo._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (res.ok) {
        fetchTodos(token);
      }
    } catch (error) {
      toast.error('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`/api/ceo/calendar/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Todo deleted');
        fetchTodos(token);
        setSelectedTodos([]);
      }
    } catch (error) {
      toast.error('Failed to delete todo');
    }
  };

  const handleToggleSelectTodo = (todoId) => {
    setSelectedTodos((prev) =>
      prev.includes(todoId) ? prev.filter((id) => id !== todoId) : [...prev, todoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTodos.length === filteredTodos.length) {
      setSelectedTodos([]);
    } else {
      setSelectedTodos(filteredTodos.map((todo) => todo._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTodos.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedTodos.length} task(s)?`)) return;

    const token = localStorage.getItem('accessToken');

    try {
      await Promise.all(
        selectedTodos.map((id) =>
          fetch(`/api/ceo/calendar/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      toast.success(`${selectedTodos.length} task(s) deleted`);
      setSelectedTodos([]);
      fetchTodos(token);
    } catch (error) {
      toast.error('Failed to delete tasks');
    }
  };

  const handleBulkComplete = async () => {
    if (selectedTodos.length === 0) return;

    const token = localStorage.getItem('accessToken');

    try {
      await Promise.all(
        selectedTodos.map((id) =>
          fetch(`/api/ceo/calendar/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ completed: true }),
          })
        )
      );

      toast.success(`${selectedTodos.length} task(s) marked as complete`);
      setSelectedTodos([]);
      fetchTodos(token);
    } catch (error) {
      toast.error('Failed to update tasks');
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const today = new Date();

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[100px] bg-gray-50"></div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      const isSelected =
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();
      const dayTodos = getTodosForDate(date);

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          onDoubleClick={() => {
            handleDateClick(day);
            setTimeout(() => handleCreateTodo(), 100);
          }}
          className={`min-h-[60px] sm:min-h-[100px] border border-gray-200 p-1 sm:p-2 cursor-pointer hover:bg-mint-cream transition-smooth ${
            isToday ? 'bg-blue-50 border-blue-400' : ''
          } ${isSelected ? 'ring-2 ring-quinacridone-magenta' : ''}`}
          title="Click to select"
        >
          <div
            className={`text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}
          >
            {day}
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            {dayTodos.slice(0, window.innerWidth < 640 ? 2 : 3).map((todo) => (
              <div
                key={todo._id}
                className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate ${
                  todo.completed
                    ? 'bg-gray-200 line-through text-gray-500'
                    : todo.priority === 'urgent'
                      ? 'bg-red-100 text-red-700'
                      : todo.priority === 'high'
                        ? 'bg-orange-100 text-orange-700'
                        : todo.priority === 'medium'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                }`}
              >
                <span className="hidden sm:inline">{todo.start_time && `${todo.start_time} `}</span>
                {todo.title}
              </div>
            ))}
            {dayTodos.length > 3 && (
              <div className="text-xs text-gray-500 font-semibold">+{dayTodos.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-cream flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // Mobile Todo View Component
  if (showMobileTodoView && selectedDate) {
    return (
      <div className="min-h-screen bg-mint-cream">
        {/* Mobile Todo View Header */}
        <nav className="gradient-dark shadow-lg sticky top-0 z-40">
          <div className="px-3 py-3 flex items-center gap-3">
            <button
              onClick={() => setShowMobileTodoView(false)}
              className="text-white hover:text-mint-cream transition-smooth p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div className="flex-1">
              <p className="text-xs text-mint-cream font-medium">Tasks for</p>
              <h1 className="text-lg font-bold text-white">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h1>
            </div>
            <button
              onClick={handleCreateTodo}
              className="bg-white text-quinacridone-magenta px-3 py-2 rounded-lg hover:bg-mint-cream transition-smooth text-sm font-bold"
            >
              + New
            </button>
          </div>
        </nav>

        {/* Mobile Todo List */}
        <main className="p-3">
          {/* Bulk Actions */}
          {selectedTodos.length > 0 && (
            <div className="mb-3 p-2.5 bg-gradient-to-r from-quinacridone-magenta/10 to-palatinate/10 border border-quinacridone-magenta/20 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-quinacridone-magenta flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{selectedTodos.length}</span>
                  </div>
                  <span className="text-sm font-bold text-dark-purple">
                    {selectedTodos.length} selected
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleSelectAll}
                    className="px-2 py-1.5 bg-white text-dark-purple rounded-lg text-xs font-semibold border"
                  >
                    {selectedTodos.length === filteredTodos.length ? 'Clear' : 'All'}
                  </button>
                  <button
                    onClick={handleBulkComplete}
                    className="px-2 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-2 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Todo List */}
          <div className="space-y-2">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 font-semibold">No tasks yet</p>
                <p className="text-xs text-gray-400 mt-1">Tap "+ New" to create one</p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <div
                  key={todo._id}
                  className={`p-3 rounded-lg border-l-4 bg-white shadow-sm ${
                    selectedTodos.includes(todo._id) ? 'ring-2 ring-quinacridone-magenta' : ''
                  } ${
                    todo.completed
                      ? 'border-l-gray-300 opacity-60'
                      : todo.priority === 'urgent'
                        ? 'border-l-red-500'
                        : todo.priority === 'high'
                          ? 'border-l-orange-500'
                          : todo.priority === 'medium'
                            ? 'border-l-blue-500'
                            : 'border-l-green-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTodos.includes(todo._id)}
                      onChange={() => handleToggleSelectTodo(todo._id)}
                      className="mt-0.5 w-4 h-4 text-quinacridone-magenta rounded cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-base font-semibold ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}
                      >
                        {todo.title}
                      </h4>
                      {todo.description && (
                        <p className="text-sm text-gray-500 mt-1">{todo.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                        {(todo.start_time || todo.end_time) && (
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {todo.start_time}
                            {todo.end_time && `-${todo.end_time}`}
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-medium">
                          {todo.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleComplete(todo)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded text-sm font-semibold ${
                        todo.completed ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Done
                    </button>
                    <button
                      onClick={() => handleEditTodo(todo)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-700 rounded text-sm font-semibold"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(todo._id)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-700 rounded text-sm font-semibold"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Todo Modal */}
        {showTodoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
              <div className="p-3">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-dark-purple">
                    {editingTodo ? 'Edit Task' : 'Create Task'}
                  </h2>
                  <button
                    onClick={() => setShowTodoModal(false)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {/* Form content will be rendered here - same as desktop */}
                <form onSubmit={handleSubmitTodo} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-dark-purple mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                      placeholder="Enter task title..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-purple mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                      rows="2"
                      placeholder="Enter description..."
                    />
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-300 rounded-lg flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Date</p>
                      <p className="text-sm font-bold text-dark-purple">
                        {new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-dark-purple mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-purple mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-dark-purple mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-purple mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                      >
                        <option value="task">Task</option>
                        <option value="meeting">Meeting</option>
                        <option value="reminder">Reminder</option>
                        <option value="event">Event</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-purple mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                      rows="2"
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 gradient-primary text-white px-4 py-2 rounded-lg hover-lift font-semibold text-sm"
                    >
                      {editingTodo ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTodoModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-smooth text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mint-cream">
      {/* Mobile-Optimized Navigation */}
      <nav className="gradient-dark shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/ceo')}
              className="text-white hover:text-mint-cream transition-smooth p-1"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-white">Calendar & Tasks</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-mint-cream hidden sm:inline">
              {user?.name}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-8">
        <div className="grid gap-3 sm:gap-6 lg:grid-cols-3">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6">
              {/* Calendar Header - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-2xl font-bold text-dark-purple">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleToday}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-mint-cream text-dark-purple rounded-lg hover:bg-quinacridone-magenta hover:text-white transition-smooth font-semibold"
                  >
                    Today
                  </button>
                  <button
                    onClick={handlePrevMonth}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-mint-cream text-dark-purple rounded-lg hover:bg-quinacridone-magenta hover:text-white transition-smooth"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-mint-cream text-dark-purple rounded-lg hover:bg-quinacridone-magenta hover:text-white transition-smooth"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Calendar Grid - Mobile Optimized */}
              <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="bg-gray-100 p-1 sm:p-2 text-center font-semibold text-xs sm:text-sm text-gray-700 border-b border-gray-200"
                  >
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                  </div>
                ))}
                {renderCalendar()}
              </div>
            </div>
          </div>

          {/* Sidebar - Hidden on Mobile, Visible on Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-20">
              {/* Header */}
              <div className="gradient-primary p-3 flex justify-between items-center">
                <div>
                  <p className="text-xs text-mint-cream font-medium">Selected Date</p>
                  <h3 className="text-base font-bold text-white">
                    {selectedDate
                      ? selectedDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Select a date'}
                  </h3>
                </div>
                {selectedDate && (
                  <button
                    onClick={handleCreateTodo}
                    className="bg-white text-quinacridone-magenta px-3 py-1.5 rounded-lg hover:bg-mint-cream transition-smooth text-xs font-bold"
                  >
                    + New
                  </button>
                )}
              </div>

              {selectedDate ? (
                <>
                  {/* Bulk Actions - Only show when todos are selected */}
                  {selectedTodos.length > 0 && (
                    <div className="p-2.5 sm:p-3 bg-gradient-to-r from-quinacridone-magenta/10 to-palatinate/10 border-b border-quinacridone-magenta/20 animate-in slide-in-from-top">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 rounded-full bg-quinacridone-magenta flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {selectedTodos.length}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-dark-purple">
                            {selectedTodos.length} selected
                          </span>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2">
                          <button
                            onClick={handleSelectAll}
                            className="px-2 sm:px-3 py-1.5 bg-white text-dark-purple rounded-lg hover:bg-gray-50 transition-smooth text-xs font-semibold border border-gray-200"
                          >
                            {selectedTodos.length === filteredTodos.length ? 'Deselect' : 'All'}
                          </button>
                          <button
                            onClick={handleBulkComplete}
                            className="px-2 sm:px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-smooth text-xs font-semibold shadow-sm"
                          >
                            ✓ Done
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            className="px-2 sm:px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-smooth text-xs font-semibold shadow-sm"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto p-2 sm:p-3">
                    {filteredTodos.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 font-semibold">
                          No tasks yet
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Tap "+ New" to create one</p>
                      </div>
                    ) : (
                      filteredTodos.map((todo) => (
                        <div
                          key={todo._id}
                          className={`group p-2 sm:p-2.5 rounded-lg border-l-4 bg-white shadow-sm hover:shadow-md transition-all ${
                            selectedTodos.includes(todo._id)
                              ? 'ring-2 ring-quinacridone-magenta'
                              : ''
                          } ${
                            todo.completed
                              ? 'border-l-gray-300 opacity-60'
                              : todo.priority === 'urgent'
                                ? 'border-l-red-500'
                                : todo.priority === 'high'
                                  ? 'border-l-orange-500'
                                  : todo.priority === 'medium'
                                    ? 'border-l-blue-500'
                                    : 'border-l-green-500'
                          }`}
                        >
                          {/* Header with checkbox and title */}
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selectedTodos.includes(todo._id)}
                              onChange={() => handleToggleSelectTodo(todo._id)}
                              className="mt-0.5 w-4 h-4 text-quinacridone-magenta rounded focus:ring-2 focus:ring-palatinate cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm sm:text-base font-semibold leading-tight ${
                                  todo.completed ? 'line-through text-gray-400' : 'text-gray-900'
                                }`}
                              >
                                {todo.title}
                              </h4>
                              {todo.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {todo.description}
                                </p>
                              )}

                              {/* Meta info */}
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-xs">
                                {(todo.start_time || todo.end_time) && (
                                  <span className="inline-flex items-center gap-1 text-gray-600">
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    {todo.start_time}
                                    {todo.end_time && `-${todo.end_time}`}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-medium">
                                  {todo.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons - Minimal & Clean */}
                          <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleToggleComplete(todo)}
                              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold transition-all ${
                                todo.completed
                                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="hidden sm:inline">Done</span>
                            </button>
                            <button
                              onClick={() => handleEditTodo(todo)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold transition-all"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTodo(todo._id)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold transition-all"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span className="hidden sm:inline">Del</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">Click on a date to view tasks</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Todo Modal - Mobile Optimized */}
      {showTodoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-3 sm:p-4">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-dark-purple">
                  {editingTodo ? 'Edit Task' : 'Create Task'}
                </h2>
                <button
                  onClick={() => setShowTodoModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitTodo} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-purple mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    placeholder="Enter task title..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-purple mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    rows="2"
                    placeholder="Enter description..."
                  />
                </div>

                {/* Date Display - Compact */}
                <div className="p-2 bg-blue-50 border border-blue-300 rounded-lg flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-xs text-blue-600 font-semibold">Date</p>
                    <p className="text-sm font-bold text-dark-purple">
                      {new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-dark-purple mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-purple mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-dark-purple mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-purple mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    >
                      <option value="task">Task</option>
                      <option value="meeting">Meeting</option>
                      <option value="reminder">Reminder</option>
                      <option value="event">Event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-purple mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    rows="2"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 gradient-primary text-white px-4 py-2 rounded-lg hover-lift font-semibold text-sm"
                  >
                    {editingTodo ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTodoModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-smooth text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
