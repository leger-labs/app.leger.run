import type { Story } from "@ladle/react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./resizable";

export const HorizontalPanels: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Horizontal Resizable Panels</h3>
        <ResizablePanelGroup direction="horizontal" className="h-[400px] rounded-lg border">
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Left Panel</span>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Right Panel</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export const VerticalPanels: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Vertical Resizable Panels</h3>
        <ResizablePanelGroup direction="vertical" className="h-[400px] rounded-lg border">
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Top Panel</span>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Bottom Panel</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export const WithHandle: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">With Visible Handle</h3>
        <ResizablePanelGroup direction="horizontal" className="h-[400px] rounded-lg border">
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Panel 1</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Panel 2</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export const ThreePanels: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Three Panel Layout</h3>
        <ResizablePanelGroup direction="horizontal" className="h-[400px] rounded-lg border">
          <ResizablePanel defaultSize={25}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Sidebar</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Main Content</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Inspector</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export const NestedPanels: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Nested Panels</h3>
        <ResizablePanelGroup direction="horizontal" className="h-[500px] rounded-lg border">
          <ResizablePanel defaultSize={30}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Sidebar</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">Main Content</span>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">Footer</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export const CodeEditor: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Code Editor Layout</h3>
        <ResizablePanelGroup direction="horizontal" className="h-[600px] rounded-lg border">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full bg-muted/30 p-4">
              <p className="font-semibold mb-4">Explorer</p>
              <div className="space-y-1 text-sm">
                <div className="p-1 hover:bg-accent rounded">📁 src</div>
                <div className="p-1 hover:bg-accent rounded pl-4">📄 App.tsx</div>
                <div className="p-1 hover:bg-accent rounded pl-4">📄 index.tsx</div>
                <div className="p-1 hover:bg-accent rounded">📁 components</div>
                <div className="p-1 hover:bg-accent rounded">📁 utils</div>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Editor */}
          <ResizablePanel defaultSize={60}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70}>
                <div className="h-full p-4">
                  <p className="font-semibold mb-4">Editor</p>
                  <pre className="text-sm font-mono">
                    <code>{`function App() {
  return (
    <div className="App">
      <h1>Hello World</h1>
    </div>
  );
}`}</code>
                  </pre>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full bg-muted/30 p-4">
                  <p className="font-semibold mb-4">Terminal</p>
                  <div className="font-mono text-xs">
                    <p>$ npm start</p>
                    <p className="text-muted-foreground">Starting dev server...</p>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Properties Panel */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full bg-muted/30 p-4">
              <p className="font-semibold mb-4">Properties</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Component</p>
                  <p className="font-medium">App</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Type</p>
                  <p className="font-medium">Function</p>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export const EmailClient: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Email Client Layout</h3>
        <ResizablePanelGroup direction="horizontal" className="h-[500px] rounded-lg border">
          {/* Folder List */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full border-r p-4">
              <p className="font-semibold mb-4">Folders</p>
              <div className="space-y-1 text-sm">
                <div className="p-2 bg-accent rounded font-medium">Inbox (12)</div>
                <div className="p-2 hover:bg-accent rounded">Sent</div>
                <div className="p-2 hover:bg-accent rounded">Drafts (3)</div>
                <div className="p-2 hover:bg-accent rounded">Spam</div>
                <div className="p-2 hover:bg-accent rounded">Trash</div>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle />

          {/* Email List */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <div className="h-full border-r p-4">
              <p className="font-semibold mb-4">Messages</p>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 border rounded hover:bg-accent cursor-pointer">
                    <p className="font-medium text-sm">Email Subject {i}</p>
                    <p className="text-xs text-muted-foreground">From sender@example.com</p>
                  </div>
                ))}
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle />

          {/* Email Content */}
          <ResizablePanel defaultSize={50}>
            <div className="h-full p-4">
              <p className="font-semibold mb-4">Email Content</p>
              <div className="space-y-4">
                <div className="pb-4 border-b">
                  <h3 className="font-semibold">Subject: Important Update</h3>
                  <p className="text-sm text-muted-foreground">From: sender@example.com</p>
                </div>
                <div className="text-sm">
                  <p>Dear Team,</p>
                  <p className="mt-2">This is the email content...</p>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
