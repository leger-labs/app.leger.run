import type { Story } from "@ladle/react";
import { useState } from "react";
import { Toggle } from "./toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Eye, EyeOff, Volume2, VolumeX, Star } from "lucide-react";

export const Basic: Story = () => {
  const [bold, setBold] = useState(false);

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Basic Toggle</CardTitle>
          <CardDescription>Simple on/off toggle button</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Toggle pressed={bold} onPressedChange={setBold} aria-label="Toggle bold">
              <Bold className="h-4 w-4" />
            </Toggle>
            <span className="text-sm text-muted-foreground">
              {bold ? "Bold is ON" : "Bold is OFF"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const WithText: Story = () => {
  const [visible, setVisible] = useState(true);

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Toggle with Text</CardTitle>
          <CardDescription>Toggle button with icon and text label</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle pressed={visible} onPressedChange={setVisible} aria-label="Toggle visibility">
            {visible ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Visible
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hidden
              </>
            )}
          </Toggle>
        </CardContent>
      </Card>
    </div>
  );
};

export const Sizes: Story = () => {
  const [small, setSmall] = useState(false);
  const [medium, setMedium] = useState(false);
  const [large, setLarge] = useState(false);

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Toggle Sizes</CardTitle>
          <CardDescription>Small, default, and large sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Toggle size="sm" pressed={small} onPressedChange={setSmall} aria-label="Small">
              <Bold className="h-3 w-3" />
            </Toggle>
            <span className="text-sm text-muted-foreground">Small</span>
          </div>
          <div className="flex items-center gap-4">
            <Toggle pressed={medium} onPressedChange={setMedium} aria-label="Default">
              <Bold className="h-4 w-4" />
            </Toggle>
            <span className="text-sm text-muted-foreground">Default</span>
          </div>
          <div className="flex items-center gap-4">
            <Toggle size="lg" pressed={large} onPressedChange={setLarge} aria-label="Large">
              <Bold className="h-5 w-5" />
            </Toggle>
            <span className="text-sm text-muted-foreground">Large</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const Variants: Story = () => {
  const [defaultVariant, setDefaultVariant] = useState(false);
  const [outlineVariant, setOutlineVariant] = useState(false);

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Toggle Variants</CardTitle>
          <CardDescription>Default and outline styles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Toggle variant="default" pressed={defaultVariant} onPressedChange={setDefaultVariant} aria-label="Default variant">
              <Bold className="h-4 w-4" />
            </Toggle>
            <span className="text-sm text-muted-foreground">Default</span>
          </div>
          <div className="flex items-center gap-4">
            <Toggle variant="outline" pressed={outlineVariant} onPressedChange={setOutlineVariant} aria-label="Outline variant">
              <Bold className="h-4 w-4" />
            </Toggle>
            <span className="text-sm text-muted-foreground">Outline</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const DisabledState: Story = () => {
  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Disabled Toggle</CardTitle>
          <CardDescription>Toggle in disabled state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Toggle disabled aria-label="Disabled off">
              <Bold className="h-4 w-4" />
            </Toggle>
            <span className="text-sm text-muted-foreground">Disabled (off)</span>
          </div>
          <div className="flex items-center gap-4">
            <Toggle disabled pressed aria-label="Disabled on">
              <Italic className="h-4 w-4" />
            </Toggle>
            <span className="text-sm text-muted-foreground">Disabled (on)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const TextFormattingToolbar: Story = () => {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Text Formatting</CardTitle>
          <CardDescription>Toggle text formatting options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-2 border rounded-md w-fit">
            <Toggle pressed={bold} onPressedChange={setBold} aria-label="Toggle bold">
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle pressed={italic} onPressedChange={setItalic} aria-label="Toggle italic">
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle pressed={underline} onPressedChange={setUnderline} aria-label="Toggle underline">
              <Underline className="h-4 w-4" />
            </Toggle>
          </div>
          <div className="p-4 border rounded-md">
            <p className={`text-sm ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${underline ? 'underline' : ''}`}>
              Sample text with formatting applied
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const TextAlignment: Story = () => {
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Text Alignment</CardTitle>
          <CardDescription>Toggle between alignment options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-2 border rounded-md w-fit">
            <Toggle
              pressed={alignment === 'left'}
              onPressedChange={() => setAlignment('left')}
              aria-label="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={alignment === 'center'}
              onPressedChange={() => setAlignment('center')}
              aria-label="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={alignment === 'right'}
              onPressedChange={() => setAlignment('right')}
              aria-label="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Toggle>
          </div>
          <div className="p-4 border rounded-md">
            <p className={`text-sm text-${alignment}`}>
              This text is {alignment}-aligned
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AudioVideoControls: Story = () => {
  const [muted, setMuted] = useState(false);
  const [favorite, setFavorite] = useState(false);

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Media Controls</CardTitle>
          <CardDescription>Toggle audio and favorite states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Toggle variant="outline" pressed={muted} onPressedChange={setMuted} aria-label="Toggle mute">
              {muted ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Muted
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Unmuted
                </>
              )}
            </Toggle>
            <Toggle variant="outline" pressed={favorite} onPressedChange={setFavorite} aria-label="Toggle favorite">
              <Star className={`h-4 w-4 mr-2 ${favorite ? 'fill-current' : ''}`} />
              {favorite ? 'Favorited' : 'Favorite'}
            </Toggle>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const VisibilityToggle: Story = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Password Visibility</CardTitle>
          <CardDescription>Toggle password visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type={showPassword ? "text" : "password"}
              value="mysecretpassword"
              readOnly
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Toggle
              variant="outline"
              pressed={showPassword}
              onPressedChange={setShowPassword}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Toggle>
          </div>
          <p className="text-xs text-muted-foreground">
            Click the eye icon to toggle password visibility
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
