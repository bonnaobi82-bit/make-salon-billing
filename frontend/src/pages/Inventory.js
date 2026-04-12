import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { Plus, Edit, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    category: 'hair_care',
    quantity: 0,
    unit_price: 0,
    supplier: '',
    reorder_level: 10
  });

  const categories = ['hair_care', 'skin_care', 'nail_care', 'equipment', 'consumables', 'other'];

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await authAxios.get('/inventory');
      setInventory(response.data);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await authAxios.put(`/inventory/${editingItem.id}`, formData);
        toast.success('Item updated successfully');
      } else {
        await authAxios.post('/inventory', formData);
        toast.success('Item added successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({ product_name: '', category: 'hair_care', quantity: 0, unit_price: 0, supplier: '', reorder_level: 10 });
    setEditingItem(null);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      product_name: item.product_name,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      supplier: item.supplier || '',
      reorder_level: item.reorder_level
    });
    setDialogOpen(true);
  };

  const isLowStock = (item) => item.quantity <= item.reorder_level;

  return (
    <Layout>
      <div className="space-y-6" data-testid="inventory-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif text-[#1B3B36]">Inventory Management</h2>
            <p className="text-sm text-[#6B726C] mt-1">Track your salon products and supplies</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2" data-testid="add-inventory-button">
                <Plus size={18} />
                Add Item
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="input-field"
                    required
                    data-testid="inventory-product-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                    data-testid="inventory-category-select"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1B3B36] mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                      className="input-field"
                      required
                      min="0"
                      data-testid="inventory-quantity-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B3B36] mb-2">Unit Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                      className="input-field"
                      required
                      min="0"
                      step="0.01"
                      data-testid="inventory-price-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="input-field"
                    data-testid="inventory-supplier-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Reorder Level *</label>
                  <input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) })}
                    className="input-field"
                    required
                    min="0"
                    data-testid="inventory-reorder-input"
                  />
                  <p className="text-xs text-[#6B726C] mt-1">Alert when stock falls below this level</p>
                </div>
                <button type="submit" className="btn-primary w-full" data-testid="inventory-submit-button">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="stat-card">
          <div className="table-container">
            <table className="data-table" data-testid="inventory-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">Loading...</td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8" data-testid="no-inventory-message">
                      No items found. Add your first inventory item!
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} data-testid={`inventory-row-${item.id}`}>
                      <td className="font-medium text-[#1B3B36]">{item.product_name}</td>
                      <td className="capitalize">
                        {item.category.split('_').join(' ')}
                      </td>
                      <td>{item.quantity}</td>
                      <td>₹{item.unit_price}</td>
                      <td className="font-medium">₹{(item.quantity * item.unit_price).toFixed(2)}</td>
                      <td>{item.supplier || '-'}</td>
                      <td>
                        {isLowStock(item) ? (
                          <span className="badge badge-danger flex items-center gap-1 w-fit">
                            <AlertCircle size={12} />
                            Low Stock
                          </span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => openEditDialog(item)}
                          className="p-2 hover:bg-[#F3F4F1] rounded-lg transition-colors"
                          data-testid={`edit-inventory-${item.id}`}
                        >
                          <Edit size={16} className="text-[#1B3B36]" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Inventory;
