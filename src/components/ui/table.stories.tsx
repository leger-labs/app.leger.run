import type { Story } from "@ladle/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "./table";
import { Badge } from "./badge";
import { Button } from "./button";

export const Basic: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Table>
          <TableCaption>A list of recent invoices</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Credit Card</TableCell>
              <TableCell className="text-right">$250.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">INV002</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>PayPal</TableCell>
              <TableCell className="text-right">$150.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">INV003</TableCell>
              <TableCell>Unpaid</TableCell>
              <TableCell>Bank Transfer</TableCell>
              <TableCell className="text-right">$350.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const WithFooter: Story = () => {
  const invoices = [
    { id: "INV001", status: "Paid", method: "Credit Card", amount: 250.00 },
    { id: "INV002", status: "Pending", method: "PayPal", amount: 150.00 },
    { id: "INV003", status: "Paid", method: "Bank Transfer", amount: 350.00 },
    { id: "INV004", status: "Paid", method: "Credit Card", amount: 450.00 },
  ];

  const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Table>
          <TableCaption>Recent invoice summary</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell>{invoice.method}</TableCell>
                <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right font-bold">${total.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};

export const WithBadges: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">#3001</TableCell>
              <TableCell>John Doe</TableCell>
              <TableCell>
                <Badge variant="default">Completed</Badge>
              </TableCell>
              <TableCell className="text-right">$450.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">#3002</TableCell>
              <TableCell>Jane Smith</TableCell>
              <TableCell>
                <Badge variant="secondary">Processing</Badge>
              </TableCell>
              <TableCell className="text-right">$275.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">#3003</TableCell>
              <TableCell>Bob Johnson</TableCell>
              <TableCell>
                <Badge variant="destructive">Cancelled</Badge>
              </TableCell>
              <TableCell className="text-right">$125.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">#3004</TableCell>
              <TableCell>Alice Brown</TableCell>
              <TableCell>
                <Badge variant="outline">Pending</Badge>
              </TableCell>
              <TableCell className="text-right">$550.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const WithActions: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Delete</Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>Editor</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Delete</Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Bob Johnson</TableCell>
              <TableCell>bob@example.com</TableCell>
              <TableCell>Viewer</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Delete</Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const CompactTable: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="w-24">Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { id: 1, task: "Update documentation", priority: "High", due: "Today" },
              { id: 2, task: "Fix bug in login", priority: "Critical", due: "Today" },
              { id: 3, task: "Review PR #123", priority: "Medium", due: "Tomorrow" },
              { id: 4, task: "Prepare demo", priority: "Low", due: "Next week" },
            ].map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-muted-foreground">{item.id}</TableCell>
                <TableCell>{item.task}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.priority === "Critical" ? "destructive" :
                      item.priority === "High" ? "default" :
                      item.priority === "Medium" ? "secondary" : "outline"
                    }
                  >
                    {item.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.due}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const EmptyState: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                <div className="text-muted-foreground">
                  <p>No results found</p>
                  <Button variant="link" className="mt-2">
                    Add your first item
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const SelectableRows: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input type="checkbox" className="rounded" />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { name: "Alice Johnson", email: "alice@example.com", status: "Active" },
              { name: "Bob Smith", email: "bob@example.com", status: "Active" },
              { name: "Charlie Brown", email: "charlie@example.com", status: "Inactive" },
            ].map((user, i) => (
              <TableRow key={i}>
                <TableCell>
                  <input type="checkbox" className="rounded" />
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                    {user.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const DataTable: Story = () => {
  const data = [
    { id: 1, product: "Laptop", category: "Electronics", stock: 45, price: 999.99 },
    { id: 2, product: "Mouse", category: "Electronics", stock: 150, price: 29.99 },
    { id: 3, product: "Desk", category: "Furniture", stock: 12, price: 299.99 },
    { id: 4, product: "Chair", category: "Furniture", stock: 8, price: 199.99 },
    { id: 5, product: "Monitor", category: "Electronics", stock: 25, price: 349.99 },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Product Inventory</h3>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-muted-foreground">{item.id}</TableCell>
                <TableCell className="font-medium">{item.product}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={item.stock < 10 ? "destructive" : "secondary"}>
                    {item.stock}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">${item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
