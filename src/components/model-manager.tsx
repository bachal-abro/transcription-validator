'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Model {
  id: string;
  model_name: string;
  description: string | null;
  created_at?: string;
}

export function ModelManager() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ model_name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  async function fetchModels() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load models');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.model_name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const url = editingId ? `/api/models/${editingId}` : '/api/models';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage(editingId ? 'Model updated successfully' : 'Model added successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        setFormData({ model_name: '', description: '' });
        setEditingId(null);
        setShowAddForm(false);
        fetchModels();
      } else {
        const data = await response.json();
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Failed to save model');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will affect all associated transcriptions.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/models/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('Model deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchModels();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete model');
      }
    } catch (err) {
      setError('Failed to delete model');
      console.error(err);
    }
  }

  function startEdit(model: Model) {
    setEditingId(model.id);
    setFormData({ model_name: model.model_name, description: model.description || '' });
    setShowAddForm(true);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ model_name: '', description: '' });
    setError(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Add Model Button */}
      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add New Model
        </Button>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-3 bg-muted/30">
          <h3 className="font-medium">{editingId ? 'Edit Model' : 'Add New Model'}</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Model Name *</label>
            <Input
              value={formData.model_name}
              onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
              placeholder="e.g., Whisper Large V3"
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of the model..."
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || !formData.model_name.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingId ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>{editingId ? 'Update Model' : 'Add Model'}</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={cancelEdit} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Models List */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground">
          Existing Models ({models.length})
        </h3>
        
        {models.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No models found. Add your first model above.</p>
            <p className="text-xs mt-2">Make sure you&apos;ve run schema.sql in Supabase</p>
          </div>
        ) : (
          <div className="space-y-2">
            {models.map((model) => (
              <div
                key={model.id}
                className={cn(
                  'p-4 border rounded-lg',
                  editingId === model.id ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300' : 'bg-card'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{model.model_name}</h4>
                    {model.description && (
                      <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">ID: {model.id}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(model)}
                      title="Edit model"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(model.id, model.model_name)}
                      title="Delete model"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
