import type { Story } from "@ladle/react";
import { AspectRatio } from "./aspect-ratio";
import { Card, CardContent } from "./card";

export const Basic16x9: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">16:9 Aspect Ratio</h3>
        <AspectRatio ratio={16 / 9}>
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center text-white font-semibold">
            16:9
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export const Square: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">1:1 Square</h3>
        <AspectRatio ratio={1 / 1}>
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-md flex items-center justify-center text-white font-semibold">
            1:1
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export const Portrait: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">9:16 Portrait</h3>
        <AspectRatio ratio={9 / 16}>
          <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-md flex items-center justify-center text-white font-semibold">
            9:16
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export const Ultrawide: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">21:9 Ultrawide</h3>
        <AspectRatio ratio={21 / 9}>
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center text-white font-semibold">
            21:9
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export const WithImage: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">Image with 16:9 Ratio</h3>
        <AspectRatio ratio={16 / 9}>
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-md flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-2">🖼️</div>
              <p className="text-sm font-medium">Image Placeholder</p>
              <p className="text-xs opacity-75">16:9 Ratio</p>
            </div>
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export const VideoPlayer: Story = () => {
  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-0">
          <AspectRatio ratio={16 / 9}>
            <div className="bg-black rounded-t-md flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">▶️</div>
                <p className="text-lg font-medium">Video Player</p>
                <p className="text-sm opacity-75">1920x1080 (16:9)</p>
              </div>
            </div>
          </AspectRatio>
          <div className="p-4 border-t">
            <h3 className="font-semibold mb-1">Video Title</h3>
            <p className="text-sm text-muted-foreground">
              This video maintains a 16:9 aspect ratio
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ProductImageGrid: Story = () => {
  const products = [
    { name: "Product 1", color: "from-red-400 to-pink-600" },
    { name: "Product 2", color: "from-blue-400 to-cyan-600" },
    { name: "Product 3", color: "from-green-400 to-emerald-600" },
    { name: "Product 4", color: "from-purple-400 to-pink-600" },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Product Grid (Square Images)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <AspectRatio ratio={1 / 1}>
                  <div className={`bg-gradient-to-br ${product.color} rounded-t-md flex items-center justify-center text-white font-semibold`}>
                    {i + 1}
                  </div>
                </AspectRatio>
                <div className="p-3">
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">$99.00</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ResponsiveGallery: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Responsive Gallery</h3>
          <p className="text-sm text-muted-foreground mb-4">
            All images maintain their aspect ratio while filling available space
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AspectRatio ratio={16 / 9}>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-md flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-xl font-semibold">Landscape</p>
                <p className="text-sm opacity-75">16:9</p>
              </div>
            </div>
          </AspectRatio>

          <AspectRatio ratio={4 / 3}>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-xl font-semibold">Standard</p>
                <p className="text-sm opacity-75">4:3</p>
              </div>
            </div>
          </AspectRatio>

          <AspectRatio ratio={1 / 1}>
            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-md flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-xl font-semibold">Square</p>
                <p className="text-sm opacity-75">1:1</p>
              </div>
            </div>
          </AspectRatio>

          <AspectRatio ratio={3 / 2}>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-md flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-xl font-semibold">Photo</p>
                <p className="text-sm opacity-75">3:2</p>
              </div>
            </div>
          </AspectRatio>
        </div>
      </div>
    </div>
  );
};
