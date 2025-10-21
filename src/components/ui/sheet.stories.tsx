import type { Story } from "@ladle/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "./sheet";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

export const FromRight: Story = () => {
  return (
    <div className="p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet (Right)</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>
              This sheet slides in from the right side
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Sheet content goes here. This is the default behavior.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const FromLeft: Story = () => {
  return (
    <div className="p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet (Left)</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>
              This sheet slides in from the left side
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <nav className="space-y-2">
              {['Home', 'Products', 'About', 'Contact'].map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-3 py-2 rounded hover:bg-accent"
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const FromTop: Story = () => {
  return (
    <div className="p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet (Top)</Button>
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              This sheet slides down from the top
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded">
                <p className="font-medium text-sm">Notification {i}</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const FromBottom: Story = () => {
  return (
    <div className="p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet (Bottom)</Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Quick Actions</SheetTitle>
            <SheetDescription>
              This sheet slides up from the bottom
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 grid grid-cols-4 gap-4">
            {['Share', 'Copy', 'Edit', 'Delete'].map((action) => (
              <button
                key={action}
                className="flex flex-col items-center gap-2 p-4 rounded hover:bg-accent"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {action[0]}
                </div>
                <span className="text-xs">{action}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const WithForm: Story = () => {
  return (
    <div className="p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Edit Profile</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                defaultValue="Software developer"
              />
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit">Save changes</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const FilterPanel: Story = () => {
  return (
    <div className="p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Filters</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Refine your search results
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-6">
            <div>
              <h4 className="font-medium mb-3">Price Range</h4>
              <div className="space-y-2">
                {['Under $25', '$25 - $50', '$50 - $100', 'Over $100'].map((range) => (
                  <label key={range} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{range}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Category</h4>
              <div className="space-y-2">
                {['Electronics', 'Clothing', 'Books', 'Home'].map((category) => (
                  <label key={category} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <SheetFooter className="gap-2">
            <Button variant="outline">Clear</Button>
            <Button>Apply Filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const MobileMenu: Story = () => {
  return (
    <div className="p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">☰ Menu</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="py-4 space-y-1">
            {[
              { label: 'Home', active: true },
              { label: 'Products' },
              { label: 'Services' },
              { label: 'About' },
              { label: 'Contact' },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full text-left px-3 py-2 rounded ${
                  item.active ? 'bg-accent font-medium' : 'hover:bg-accent'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-6 left-6 right-6">
            <Button className="w-full">Sign In</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const ShoppingCart: Story = () => {
  const items = [
    { name: 'Product 1', price: 29.99, qty: 2 },
    { name: 'Product 2', price: 49.99, qty: 1 },
  ];

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Cart (2)</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Shopping Cart</SheetTitle>
            <SheetDescription>
              {items.length} items in your cart
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${(item.price * item.qty).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between mb-4">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold">${total.toFixed(2)}</span>
            </div>
            <Button className="w-full">Checkout</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
