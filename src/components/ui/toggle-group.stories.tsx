import type { Story } from "@ladle/react";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Grid, LayoutList, Image, Type, CheckSquare } from "lucide-react";

export const SingleSelection: Story = () => {
  const [value, setValue] = useState("center");

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Single Selection</CardTitle>
          <CardDescription>Only one item can be selected at a time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup type="single" value={value} onValueChange={setValue}>
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="justify" aria-label="Align justify">
              <AlignJustify className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-sm text-muted-foreground">Selected: {value || "none"}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export const MultipleSelection: Story = () => {
  const [values, setValues] = useState<string[]>(["bold"]);

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Multiple Selection</CardTitle>
          <CardDescription>Multiple items can be selected</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup type="multiple" value={values} onValueChange={setValues}>
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Toggle underline">
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-sm text-muted-foreground">
            Selected: {values.length > 0 ? values.join(", ") : "none"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const WithText: Story = () => {
  const [view, setView] = useState("grid");

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Toggle Group with Text</CardTitle>
          <CardDescription>Items with icons and text labels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup type="single" value={view} onValueChange={setView}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <LayoutList className="h-4 w-4 mr-2" />
              List
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-sm text-muted-foreground">Current view: {view}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export const Sizes: Story = () => {
  const [small, setSmall] = useState("left");
  const [medium, setMedium] = useState("left");
  const [large, setLarge] = useState("left");

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Toggle Group Sizes</CardTitle>
          <CardDescription>Small, default, and large sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Small</p>
            <ToggleGroup type="single" size="sm" value={small} onValueChange={setSmall}>
              <ToggleGroupItem value="left" aria-label="Left">
                <AlignLeft className="h-3 w-3" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Center">
                <AlignCenter className="h-3 w-3" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Right">
                <AlignRight className="h-3 w-3" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Default</p>
            <ToggleGroup type="single" value={medium} onValueChange={setMedium}>
              <ToggleGroupItem value="left" aria-label="Left">
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Center">
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Right">
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Large</p>
            <ToggleGroup type="single" size="lg" value={large} onValueChange={setLarge}>
              <ToggleGroupItem value="left" aria-label="Left">
                <AlignLeft className="h-5 w-5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Center">
                <AlignCenter className="h-5 w-5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Right">
                <AlignRight className="h-5 w-5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const Variants: Story = () => {
  const [defaultValue, setDefaultValue] = useState("left");
  const [outlineValue, setOutlineValue] = useState("left");

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Toggle Group Variants</CardTitle>
          <CardDescription>Default and outline styles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Default</p>
            <ToggleGroup type="single" variant="default" value={defaultValue} onValueChange={setDefaultValue}>
              <ToggleGroupItem value="left" aria-label="Left">
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Center">
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Right">
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Outline</p>
            <ToggleGroup type="single" variant="outline" value={outlineValue} onValueChange={setOutlineValue}>
              <ToggleGroupItem value="left" aria-label="Left">
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Center">
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Right">
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const WithDisabledItems: Story = () => {
  const [value, setValue] = useState("left");

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>With Disabled Items</CardTitle>
          <CardDescription>Some items can be disabled</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup type="single" value={value} onValueChange={setValue}>
            <ToggleGroupItem value="left" aria-label="Left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Center" disabled>
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-sm text-muted-foreground">
            Center alignment is disabled
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const TextEditorToolbar: Story = () => {
  const [formatting, setFormatting] = useState<string[]>([]);
  const [alignment, setAlignment] = useState("left");
  const [listType, setListType] = useState<string>("");

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Text Editor Toolbar</CardTitle>
          <CardDescription>Full-featured text formatting toolbar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Format:</span>
              <ToggleGroup type="multiple" value={formatting} onValueChange={setFormatting}>
                <ToggleGroupItem value="bold" aria-label="Bold">
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Italic">
                  <Italic className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Underline">
                  <Underline className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Align:</span>
              <ToggleGroup type="single" value={alignment} onValueChange={setAlignment}>
                <ToggleGroupItem value="left" aria-label="Align left">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Align center">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Align right">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">List:</span>
              <ToggleGroup type="single" value={listType} onValueChange={setListType}>
                <ToggleGroupItem value="bullet" aria-label="Bullet list">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="numbered" aria-label="Numbered list">
                  <ListOrdered className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="border rounded-md p-4 min-h-32 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Text editor content area with {formatting.length > 0 ? formatting.join(", ") : "no"} formatting,{" "}
              {alignment} alignment{listType ? `, and ${listType} list` : ""}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ContentFilters: Story = () => {
  const [filters, setFilters] = useState<string[]>(["text"]);

  const contentCounts = {
    text: 42,
    images: 18,
    tasks: 7,
  };

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Content Filters</CardTitle>
          <CardDescription>Filter content by type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup type="multiple" value={filters} onValueChange={setFilters} variant="outline">
            <ToggleGroupItem value="text" aria-label="Text">
              <Type className="h-4 w-4 mr-2" />
              Text ({contentCounts.text})
            </ToggleGroupItem>
            <ToggleGroupItem value="images" aria-label="Images">
              <Image className="h-4 w-4 mr-2" />
              Images ({contentCounts.images})
            </ToggleGroupItem>
            <ToggleGroupItem value="tasks" aria-label="Tasks">
              <CheckSquare className="h-4 w-4 mr-2" />
              Tasks ({contentCounts.tasks})
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="text-sm text-muted-foreground">
            {filters.length > 0 ? (
              <p>Showing: {filters.join(", ")}</p>
            ) : (
              <p>No filters selected - showing all content</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ViewModes: Story = () => {
  const [view, setView] = useState("grid");

  const items = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
  }));

  return (
    <div className="p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Gallery</CardTitle>
              <CardDescription>Switch between grid and list views</CardDescription>
            </div>
            <ToggleGroup type="single" variant="outline" value={view} onValueChange={setView}>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <LayoutList className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          {view === "grid" ? (
            <div className="grid grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="aspect-square rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium"
                >
                  {item.title}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-md border flex items-center gap-4"
                >
                  <div className="h-12 w-12 rounded bg-gradient-to-br from-blue-500 to-purple-600" />
                  <span className="font-medium">{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
