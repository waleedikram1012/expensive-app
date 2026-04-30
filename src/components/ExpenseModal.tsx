import React, { useState, useEffect } from 'react';
import { Expense, CATEGORIES, addExpense, updateExpense } from '../services/expenseService';
import { uploadReceipt } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { X, Loader2, ImageIcon, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: Expense;
}

export default function ExpenseModal({ isOpen, onClose, editingExpense }: ExpenseModalProps) {
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [emojiOrImageUrl, setEmojiOrImageUrl] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<'emoji' | 'image'>('emoji');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setItemName(editingExpense.itemName);
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setEmojiOrImageUrl(editingExpense.emojiOrImageUrl || '');
      setInputType(editingExpense.emojiOrImageUrl?.startsWith('http') ? 'image' : 'emoji');
    } else {
      setItemName('');
      setAmount('');
      setCategory(CATEGORIES[0]);
      setEmojiOrImageUrl('');
      setReceiptFile(null);
      setInputType('emoji');
    }
    setError('');
  }, [editingExpense, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      let finalImageUrl = emojiOrImageUrl;

      if (inputType === 'image' && receiptFile) {
        finalImageUrl = await uploadReceipt(user.uid, receiptFile);
      } else if (inputType === 'emoji') {
        finalImageUrl = emojiOrImageUrl;
      }

      const expenseData = {
        itemName,
        amount: Number(amount),
        category,
        emojiOrImageUrl: finalImageUrl,
      };

      if (editingExpense && editingExpense.id) {
        await updateExpense(user.uid, editingExpense.id, expenseData);
      } else {
        await addExpense(user.uid, expenseData);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while saving the expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => !loading && onClose()}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            className="relative glass-panel rounded-3xl w-full max-w-md overflow-hidden bg-slate-800/80 border border-white/20 shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-semibold text-white tracking-tight">
                {editingExpense ? 'Edit Expense' : 'New Expense'}
              </h2>
              <button 
                onClick={onClose}
                disabled={loading}
                className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh]">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm mb-5 backdrop-blur-md">
                  {error}
                </div>
              )}

              <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Item Description</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    dir="auto"
                    className="glass-input w-full px-4 py-3 rounded-xl text-white"
                    placeholder="e.g. Groceries or گروسری"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="glass-input w-full px-4 py-3 rounded-xl text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="glass-input w-full px-4 py-3 rounded-xl text-white [&>option]:bg-slate-800 [&>option]:text-white apperance-none"
                    >
                      {CATEGORIES.map(cat => (
                         <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Visual Identifier</label>
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-4">
                    <button
                      type="button"
                      onClick={() => setInputType('emoji')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${inputType === 'emoji' ? 'bg-white/20 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Smile className="w-4 h-4" /> Emoji
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputType('image')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${inputType === 'image' ? 'bg-white/20 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <ImageIcon className="w-4 h-4" /> Receipt
                    </button>
                  </div>

                  {inputType === 'emoji' ? (
                    <input
                      type="text"
                      value={emojiOrImageUrl}
                      onChange={(e) => setEmojiOrImageUrl(e.target.value)}
                      maxLength={5}
                      className="glass-input w-full px-4 py-3 rounded-xl text-3xl text-center"
                      placeholder="🍕"
                    />
                  ) : (
                    <div className="border hover:border-cyan-400/50 border-dashed border-white/20 rounded-xl p-5 text-center transition-colors bg-white/5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setReceiptFile(e.target.files[0]);
                          }
                        }}
                        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors cursor-pointer"
                      />
                      {receiptFile && <p className="mt-3 text-xs text-cyan-300 font-medium">{receiptFile.name}</p>}
                      {!receiptFile && editingExpense?.emojiOrImageUrl?.startsWith('http') && (
                         <p className="mt-3 text-xs text-slate-400">Current receipt image uploaded. Upload new to replace.</p>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 bg-transparent rounded-xl transition-colors border border-transparent hover:border-white/20"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                form="expense-form"
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-90 rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center min-w-[120px]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save entry'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
