import type { Story } from "@ladle/react";
import { useState } from "react";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export const Basic: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto space-y-2">
        <Label htmlFor="basic">Message</Label>
        <Textarea id="basic" placeholder="Type your message here..." />
      </div>
    </div>
  );
};

export const WithDefaultValue: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto space-y-2">
        <Label htmlFor="default">Bio</Label>
        <Textarea
          id="default"
          defaultValue="I'm a software developer passionate about building great user experiences."
        />
      </div>
    </div>
  );
};

export const CustomRows: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="space-y-2">
          <Label>Small (2 rows)</Label>
          <Textarea rows={2} placeholder="Short message..." />
        </div>
        <div className="space-y-2">
          <Label>Medium (6 rows)</Label>
          <Textarea rows={6} placeholder="Medium message..." />
        </div>
        <div className="space-y-2">
          <Label>Large (10 rows)</Label>
          <Textarea rows={10} placeholder="Long message..." />
        </div>
      </div>
    </div>
  );
};

export const Disabled: Story = () => {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto space-y-2">
        <Label htmlFor="disabled">Disabled Textarea</Label>
        <Textarea
          id="disabled"
          disabled
          defaultValue="This textarea is disabled and cannot be edited."
        />
      </div>
    </div>
  );
};

export const WithCharacterCount: Story = () => {
  const [value, setValue] = useState("");
  const maxLength = 200;

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto space-y-2">
        <Label htmlFor="char-count">Description</Label>
        <Textarea
          id="char-count"
          placeholder="Enter description (max 200 characters)..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={maxLength}
        />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {value.length} / {maxLength} characters
          </span>
          {value.length >= maxLength && (
            <span className="text-destructive">Maximum length reached</span>
          )}
        </div>
      </div>
    </div>
  );
};

export const WithValidation: Story = () => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (newValue.length < 10) {
      setError("Message must be at least 10 characters");
    } else if (newValue.length > 500) {
      setError("Message must be less than 500 characters");
    } else {
      setError("");
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto space-y-2">
        <Label htmlFor="validation">Feedback</Label>
        <Textarea
          id="validation"
          placeholder="Enter your feedback (10-500 characters)..."
          value={value}
          onChange={handleChange}
          className={error ? "border-destructive" : ""}
        />
        <div className="flex justify-between text-sm">
          <span className={error ? "text-destructive" : "text-muted-foreground"}>
            {error || `${value.length} / 500 characters`}
          </span>
          {!error && value.length >= 10 && (
            <span className="text-green-600">✓ Valid</span>
          )}
        </div>
      </div>
    </div>
  );
};

export const CommentForm: Story = () => {
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Comment submitted:", comment);
    setComment("");
  };

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Leave a Comment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Your Comment</Label>
              <Textarea
                id="comment"
                placeholder="Share your thoughts..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={comment.length < 1}>
                Post Comment
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setComment("")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export const MessageComposer: Story = () => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setMessage("");
    }, 1500);
  };

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <input
              id="subject"
              type="text"
              placeholder="Email subject"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              disabled={sending}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSend} disabled={!message || sending}>
              {sending ? "Sending..." : "Send"}
            </Button>
            <Button variant="outline">Save Draft</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const FeedbackForm: Story = () => {
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("general");

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Send Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what you think..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Please provide as much detail as possible
            </p>
          </div>
          <Button disabled={feedback.length < 10}>Submit Feedback</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export const CodeSnippet: Story = () => {
  const [code, setCode] = useState(`function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));`);

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Code Snippet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button>Save Snippet</Button>
            <Button variant="outline">Copy to Clipboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AutoExpandingHeight: Story = () => {
  const [value, setValue] = useState("");

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto space-y-2">
        <Label htmlFor="auto">Auto-resizing Textarea</Label>
        <Textarea
          id="auto"
          placeholder="Type to see auto-resize..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ minHeight: "80px", height: "auto" }}
        />
        <p className="text-xs text-muted-foreground">
          Note: This demonstrates the concept. Actual auto-resize would require additional JavaScript.
        </p>
      </div>
    </div>
  );
};
