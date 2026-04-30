import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { LogOut, Plus, Receipt, Search, Calendar, Filter, X } from 'lucide-react';
import { Expense, subscribeToExpenses, deleteExpense, CATEGORIES } from '../services/expenseService';
import ExpenseModal from '../components/ExpenseModal';
import { format, isSameWeek, isSameMonth, isSameYear, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import Tilt from 'react-parallax-tilt';

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToExpenses(user.uid, (data) => {
      setExpenses(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Derived calculations
  const { totalSpent, weeklySpent, monthlySpent, yearlySpent } = useMemo(() => {
    const now = new Date();
    let t = 0, w = 0, m = 0, y = 0;

    expenses.forEach(exp => {
      const amt = exp.amount || 0;
      t += amt;
      const d = exp.timestamp?.toMillis ? new Date(exp.timestamp.toMillis()) : new Date();
      if (isSameWeek(d, now)) w += amt;
      if (isSameMonth(d, now)) m += amt;
      if (isSameYear(d, now)) y += amt;
    });

    return { totalSpent: t, weeklySpent: w, monthlySpent: m, yearlySpent: y };
  }, [expenses]);

  // Filtering Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // 1. Search filter
      if (searchQuery) {
        if (!exp.itemName.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      
      // 2. Category filter
      if (selectedCategory && exp.category !== selectedCategory) {
        return false;
      }

      // 3. Date Range filter
      if (dateRange.start || dateRange.end) {
        const d = exp.timestamp?.toMillis ? new Date(exp.timestamp.toMillis()) : new Date();
        const start = dateRange.start ? startOfDay(parseISO(dateRange.start)) : new Date(0);
        const end = dateRange.end ? endOfDay(parseISO(dateRange.end)) : new Date(8640000000000000); // max date
        
        if (!isWithinInterval(d, { start, end })) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, searchQuery, selectedCategory, dateRange]);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      if (user) {
        await deleteExpense(user.uid, id);
      }
    }
  };

  const openNewExpenseModal = () => {
    setEditingExpense(undefined);
    setIsModalOpen(true);
  };

  const clearDateFilter = () => setDateRange({ start: '', end: '' });

  return (
    <div className="min-h-screen font-sans pb-20 relative overflow-hidden bg-slate-900">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 opacity-90" />
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-cyan-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-pink-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="glass-panel sticky top-0 z-40 rounded-none border-t-0 border-l-0 border-r-0 border-b-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-white font-semibold text-lg"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            ExpenseFlow
          </motion.div>
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signOut(auth)}
            className="text-slate-300 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 relative z-10">
        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000} className="md:col-span-2">
            <div className="glass-panel rounded-3xl p-8 h-full bg-gradient-to-br from-white/10 to-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Receipt className="w-32 h-32" />
              </div>
              <h2 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                Total All-time
              </h2>
              <div className="text-4xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-md">
                ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </Tilt>

          <div className="grid grid-rows-2 gap-4 md:col-span-2">
            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000}>
              <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">This Week</div>
                  <div className="text-2xl font-semibold text-white drop-shadow-sm">
                    ${weeklySpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                  <span className="text-cyan-400 font-bold tracking-tighter">7D</span>
                </div>
              </div>
            </Tilt>
            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000}>
               <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">This Month</div>
                  <div className="text-2xl font-semibold text-white drop-shadow-sm">
                    ${monthlySpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <span className="text-purple-400 font-bold tracking-tighter">30D</span>
                </div>
              </div>
            </Tilt>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl p-4 sm:p-5 mb-8 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between"
        >
          {/* Search */}
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search expenses by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
              dir="auto"
            />
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 w-full xl:w-auto">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar flex-nowrap shrink-0 max-w-full">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedCategory ? 'bg-white text-slate-900 shadow-md scale-105' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-white text-slate-900 shadow-md scale-105' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
              <Calendar className="w-4 h-4 text-slate-400 ml-2" />
              <input 
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
              />
              <span className="text-slate-500">-</span>
              <input 
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
              />
              {(dateRange.start || dateRange.end) && (
                <button onClick={clearDateFilter} className="p-1 hover:bg-white/10 rounded-full mr-1">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Expenses List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-white drop-shadow-sm flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-400" />
              Recent Transactions
            </h3>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openNewExpenseModal}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </motion.button>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            {filteredExpenses.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-16 text-center text-slate-400"
              >
                <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                  <Receipt className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-lg text-slate-300">No expenses found.</p>
                <p className="text-sm mt-2 opacity-70">Try adjusting your filters or add a new record.</p>
              </motion.div>
            ) : (
              <div className="divide-y divide-white/10">
                <AnimatePresence>
                  {filteredExpenses.map((expense, index) => {
                    const date = expense.timestamp?.toMillis ? new Date(expense.timestamp.toMillis()) : new Date();
                    const isUrdu = expense.languageUsed === 'urdu';
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05, ease: "easeOut" }}
                        key={expense.id} 
                        className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                          <Tilt tiltMaxAngleX={15} tiltMaxAngleY={15} scale={1.1}>
                            <div className="w-14 h-14 flex-shrink-0 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/20 shadow-inner">
                              {expense.emojiOrImageUrl ? (
                                expense.emojiOrImageUrl.startsWith('data:image') || expense.emojiOrImageUrl.startsWith('http') ? (
                                  <img src={expense.emojiOrImageUrl} alt="receipt" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-3xl drop-shadow-md">{expense.emojiOrImageUrl}</span>
                                )
                              ) : (
                                <Receipt className="w-6 h-6 text-slate-300" />
                              )}
                            </div>
                          </Tilt>
                          <div className="min-w-0 flex-1">
                            <p 
                              className={`text-white text-lg font-medium truncate drop-shadow-sm ${isUrdu ? 'font-arabic text-right w-fit ml-auto' : ''}`}
                              dir="auto"
                            >
                              {expense.itemName}
                            </p>
                            <div className="flex items-center text-xs text-slate-400 mt-1 gap-2.5">
                              <span className="px-2.5 py-1 bg-white/10 rounded-lg border border-white/5 font-medium">{expense.category}</span>
                              <span className="opacity-50">•</span>
                              <span>{format(date, 'MMM d, yyyy · h:mm a')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-5 ml-4">
                          <div className="text-white text-lg font-semibold whitespace-nowrap tracking-tight">
                            ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => handleEdit(expense)} className="text-slate-400 hover:text-cyan-400 transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full border border-transparent hover:border-cyan-400/30">Edit</button>
                            <button onClick={() => handleDelete(expense.id!)} className="text-slate-400 hover:text-pink-400 transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full border border-transparent hover:border-pink-400/30">Delete</button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </main>

      <ExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingExpense={editingExpense} 
      />
    </div>
  );
}
