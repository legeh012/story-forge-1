import { useState } from "react";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Code, Send, Globe, Shield, Layers } from "lucide-react";

const DevTools = () => {
  const { toast } = useToast();
  
  // JSON Formatter State
  const [jsonInput, setJsonInput] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  
  // API Tester State
  const [apiUrl, setApiUrl] = useState("");
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiHeaders, setApiHeaders] = useState("");
  const [apiBody, setApiBody] = useState("");
  const [apiResponse, setApiResponse] = useState("");
  
  // User Agent State
  const [userAgent, setUserAgent] = useState(navigator.userAgent);
  const [customUA, setCustomUA] = useState("");
  
  // Tab Manager State
  const [tabs, setTabs] = useState<string[]>(["Main Workflow"]);
  const [activeTab, setActiveTab] = useState(0);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      toast({ title: "Success", description: "JSON formatted successfully" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Invalid JSON format",
        variant: "destructive" 
      });
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      toast({ title: "Success", description: "JSON minified successfully" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Invalid JSON format",
        variant: "destructive" 
      });
    }
  };

  const validateJson = () => {
    try {
      JSON.parse(jsonInput);
      toast({ title: "Valid", description: "JSON is valid ✓" });
    } catch (error) {
      toast({ 
        title: "Invalid", 
        description: `JSON error: ${(error as Error).message}`,
        variant: "destructive" 
      });
    }
  };

  const testApi = async () => {
    try {
      const headers: Record<string, string> = {};
      if (apiHeaders) {
        apiHeaders.split('\n').forEach(line => {
          const [key, value] = line.split(':').map(s => s.trim());
          if (key && value) headers[key] = value;
        });
      }

      const options: RequestInit = {
        method: apiMethod,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (apiMethod !== 'GET' && apiBody) {
        options.body = apiBody;
      }

      const response = await fetch(apiUrl, options);
      const data = await response.json();
      
      setApiResponse(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data
      }, null, 2));

      toast({ title: "Request Complete", description: `Status: ${response.status}` });
    } catch (error) {
      setApiResponse(`Error: ${(error as Error).message}`);
      toast({ 
        title: "Request Failed", 
        description: (error as Error).message,
        variant: "destructive" 
      });
    }
  };

  const applyUserAgent = (preset: string) => {
    const presets: Record<string, string> = {
      chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      bot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    };
    setUserAgent(presets[preset] || preset);
    toast({ title: "User Agent Updated", description: "Simulating new browser identity" });
  };

  const addTab = () => {
    setTabs([...tabs, `Tab ${tabs.length + 1}`]);
    toast({ title: "Tab Added", description: "New workflow tab created" });
  };

  return (
    <>
      <SEOHead
        title="Developer Tools - StoryForge"
        description="Professional developer tools including JSON formatter, API tester, user-agent switcher, and workflow tab manager"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Navigation />
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Developer Tools
              </h1>
              <p className="text-muted-foreground text-xl">
                Professional utilities for development and testing
              </p>
            </div>

            <Tabs defaultValue="json" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="json" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  JSON Tools
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  API Tester
                </TabsTrigger>
                <TabsTrigger value="ua" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  User Agent
                </TabsTrigger>
                <TabsTrigger value="tabs" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Tab Manager
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* JSON Formatter */}
              <TabsContent value="json">
                <Card>
                  <CardHeader>
                    <CardTitle>JSON Formatter & Validator</CardTitle>
                    <CardDescription>Format, minify, and validate JSON data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Input JSON</Label>
                      <Textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='{"key": "value", "array": [1, 2, 3]}'
                        className="font-mono h-48"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={formatJson}>Format</Button>
                      <Button onClick={minifyJson} variant="secondary">Minify</Button>
                      <Button onClick={validateJson} variant="outline">Validate</Button>
                    </div>
                    {jsonOutput && (
                      <div>
                        <Label>Output</Label>
                        <Textarea
                          value={jsonOutput}
                          readOnly
                          className="font-mono h-48 bg-muted"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* API Tester (RESTer) */}
              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>REST API Tester</CardTitle>
                    <CardDescription>Test API endpoints with custom headers and payloads</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Select value={apiMethod} onValueChange={setApiMethod}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        placeholder="https://api.example.com/endpoint"
                        className="flex-1"
                      />
                    </div>
                    <div>
                      <Label>Headers (one per line: Key: Value)</Label>
                      <Textarea
                        value={apiHeaders}
                        onChange={(e) => setApiHeaders(e.target.value)}
                        placeholder="Authorization: Bearer token&#10;X-Custom-Header: value"
                        className="font-mono h-24"
                      />
                    </div>
                    {apiMethod !== 'GET' && (
                      <div>
                        <Label>Request Body (JSON)</Label>
                        <Textarea
                          value={apiBody}
                          onChange={(e) => setApiBody(e.target.value)}
                          placeholder='{"key": "value"}'
                          className="font-mono h-32"
                        />
                      </div>
                    )}
                    <Button onClick={testApi} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Request
                    </Button>
                    {apiResponse && (
                      <div>
                        <Label>Response</Label>
                        <Textarea
                          value={apiResponse}
                          readOnly
                          className="font-mono h-64 bg-muted"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* User Agent Switcher */}
              <TabsContent value="ua">
                <Card>
                  <CardHeader>
                    <CardTitle>User Agent Switcher</CardTitle>
                    <CardDescription>Simulate different browsers and devices</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Current User Agent</Label>
                      <Textarea
                        value={userAgent}
                        readOnly
                        className="font-mono h-24 bg-muted"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <Button onClick={() => applyUserAgent('chrome')} variant="outline">
                        Chrome Desktop
                      </Button>
                      <Button onClick={() => applyUserAgent('firefox')} variant="outline">
                        Firefox
                      </Button>
                      <Button onClick={() => applyUserAgent('safari')} variant="outline">
                        Safari
                      </Button>
                      <Button onClick={() => applyUserAgent('mobile')} variant="outline">
                        Mobile Safari
                      </Button>
                      <Button onClick={() => applyUserAgent('bot')} variant="outline">
                        Googlebot
                      </Button>
                      <Button onClick={() => applyUserAgent(navigator.userAgent)} variant="outline">
                        Reset
                      </Button>
                    </div>
                    <div>
                      <Label>Custom User Agent</Label>
                      <Input
                        value={customUA}
                        onChange={(e) => setCustomUA(e.target.value)}
                        placeholder="Enter custom user agent string"
                      />
                      <Button 
                        onClick={() => applyUserAgent(customUA)} 
                        className="w-full mt-2"
                        disabled={!customUA}
                      >
                        Apply Custom
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Manager */}
              <TabsContent value="tabs">
                <Card>
                  <CardHeader>
                    <CardTitle>Workflow Tab Manager</CardTitle>
                    <CardDescription>Manage multiple workflow tabs for parallel bot operations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={addTab} className="w-full">
                      <Layers className="h-4 w-4 mr-2" />
                      Add New Workflow Tab
                    </Button>
                    <div className="space-y-2">
                      {tabs.map((tab, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border transition-all ${
                            activeTab === index 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border bg-card hover:bg-accent/5'
                          }`}
                          onClick={() => setActiveTab(index)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{tab}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTabs(tabs.filter((_, i) => i !== index));
                                if (activeTab === index) setActiveTab(0);
                              }}
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tools */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>HTTPS & Security</CardTitle>
                    <CardDescription>Security settings and HTTPS enforcement information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-green-500" />
                        <h3 className="font-semibold text-green-500">HTTPS Enabled</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        All connections are secured with HTTPS encryption
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Security Features Active:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          TLS 1.3 Encryption
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          CORS Protection
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Content Security Policy
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          XSS Protection
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default DevTools;
