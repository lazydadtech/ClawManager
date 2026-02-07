# Component Patterns & Examples

This document provides reusable React component patterns for the OpenClaw Mission Control builder.

## Data Display Patterns

### Loading State Pattern

```tsx
export function DataDisplay() {
  const { data, isLoading, error } = trpc.feature.list.useQuery();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Failed to load data</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div>
      {data.map(item => (
        <Card key={item.id}>{/* Item content */}</Card>
      ))}
    </div>
  );
}
```

### Card Grid Pattern

```tsx
export function CardGrid({ items }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map(item => (
        <Card key={item.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Content */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Metric Card Pattern

```tsx
export function MetricCard({ label, value, icon: Icon, trend }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}
```

## Form Patterns

### Basic Form Pattern

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

export function CreateForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const mutation = trpc.feature.create.useMutation();

  const onSubmit = async (data) => {
    await mutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          {...register('title')}
          className="w-full rounded-lg border px-3 py-2"
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create'}
      </Button>
    </form>
  );
}
```

### Modal Form Pattern

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function CreateModal({ open, onOpenChange }) {
  const mutation = trpc.feature.create.useMutation();

  const onSubmit = async (data) => {
    await mutation.mutateAsync(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Form fields */}
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## List Patterns

### Sortable List Pattern

```tsx
import { useState } from 'react';

export function SortableList({ items }) {
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const sorted = [...items].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="name">Sort by Name</option>
          <option value="date">Sort by Date</option>
        </select>
        <button
          onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
          className="rounded-lg border px-3 py-2"
        >
          {order === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <div className="space-y-2">
        {sorted.map(item => (
          <div key={item.id} className="rounded-lg border p-4">
            {/* Item content */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Paginated List Pattern

```tsx
import { useState } from 'react';

export function PaginatedList({ items, itemsPerPage = 10 }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = items.slice(start, end);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {paginatedItems.map(item => (
          <div key={item.id} className="rounded-lg border p-4">
            {/* Item content */}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border px-3 py-2 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border px-3 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Status & State Patterns

### Status Badge Pattern

```tsx
const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${statusColors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
```

### Progress Indicator Pattern

```tsx
export function ProgressIndicator({ current, total, label }) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-gray-600">{current} of {total}</p>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

## Modal & Dialog Patterns

### Confirmation Dialog Pattern

```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, isLoading }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Confirm'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Notification Patterns

### Toast Pattern

```tsx
import { toast } from 'sonner';

export function useNotification() {
  const notify = {
    success: (message) => toast.success(message),
    error: (message) => toast.error(message),
    info: (message) => toast.info(message),
    loading: (message) => toast.loading(message),
  };

  return notify;
}

// Usage
const notify = useNotification();
await mutation.mutateAsync(data);
notify.success('Item created successfully');
```

### Alert Pattern

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ErrorAlert({ title, message, onDismiss }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <button onClick={onDismiss} className="mt-2 text-sm underline">
        Dismiss
      </button>
    </Alert>
  );
}
```

## Navigation Patterns

### Breadcrumb Pattern

```tsx
export function Breadcrumb({ items }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-gray-400">/</span>}
          {item.href ? (
            <a href={item.href} className="text-blue-600 hover:underline">
              {item.label}
            </a>
          ) : (
            <span className="text-gray-600">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Tab Navigation Pattern

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TabNavigation() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        {/* Overview content */}
      </TabsContent>

      <TabsContent value="details">
        {/* Details content */}
      </TabsContent>

      <TabsContent value="settings">
        {/* Settings content */}
      </TabsContent>
    </Tabs>
  );
}
```
