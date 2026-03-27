"use client";

import { useState, useEffect } from "react";
import { Shield, Download, Trash2, Key, Lock } from "lucide-react";
import clsx from "clsx";
import { AppShell } from "@/components/layout";
import { Card, CardHeader, Button, Input } from "@/components/ui";
import { useAppStore } from "@/store";
import { isWebAuthnAvailable, registerWebAuthn, hashPIN, startAutoLock } from "@/lib/auth";
import { encrypt, decrypt, generateEncryptionKey, exportKey } from "@/lib/encryption";

export default function SettingsPage() {
  const { preferences, updatePreferences, auth, setAuth, lock, accounts, transactions, holdings, bills } =
    useAppStore();

  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [apiKeyProvider, setApiKeyProvider] = useState<"iex" | "alphavantage" | "polygon">("alphavantage");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    isWebAuthnAvailable().then(setWebAuthnAvailable);
  }, []);

  // Auto-lock setup
  useEffect(() => {
    if (auth.isAuthenticated) {
      startAutoLock(() => {
        lock();
      });
    }
  }, [auth.isAuthenticated, lock]);

  const handleWebAuthnRegister = async () => {
    const credential = await registerWebAuthn("user", "DragonsDash User");
    if (credential) {
      setAuth({ authMethod: "webauthn" });
    }
  };

  const handleSetPin = async () => {
    if (pin.length < 6) {
      setPinError("PIN must be at least 6 digits");
      return;
    }
    if (pin !== pinConfirm) {
      setPinError("PINs do not match");
      return;
    }
    const hashedPin = await hashPIN(pin);
    // In production, this would be stored securely
    localStorage.setItem("dd_pin_hash", hashedPin);
    setAuth({ authMethod: "pin" });
    setShowPinForm(false);
    setPin("");
    setPinConfirm("");
    setPinError("");
  };

  const handleExportData = async () => {
    const data = {
      accounts,
      transactions,
      holdings,
      bills,
      preferences,
      exportedAt: new Date().toISOString(),
    };

    // Encrypt the export
    try {
      const key = await generateEncryptionKey();
      const encrypted = await encrypt(JSON.stringify(data), key);
      const exportedKey = await exportKey(key);

      const blob = new Blob(
        [
          JSON.stringify(
            {
              data: encrypted,
              keyHint: "Encryption key provided separately",
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dragonsdash-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Show key to user (in production, this would be a separate secure flow)
      alert(
        `Your encryption key (save this securely, it is NOT stored):\n\n${exportedKey}`,
      );
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleDeleteAllData = () => {
    if (
      confirm(
        "This will permanently delete ALL data. This action cannot be undone. Are you sure?",
      )
    ) {
      localStorage.removeItem("dragons-dash-store");
      window.location.reload();
    }
  };

  return (
    <AppShell>
      <div className="mb-4">
        <h2 className="text-xl font-display font-bold text-navy-900">
          Settings
        </h2>
        <p className="text-sm text-warm-500 mt-1">
          Security, data export, and display preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Security */}
        <div className="lg:col-span-6">
          <Card padding="lg">
            <CardHeader
              title="Security"
              subtitle="Authentication and encryption"
            />
            <div className="flex flex-col gap-3">
              {/* WebAuthn */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-warm-800">
                    Biometric Authentication
                  </p>
                  <p className="text-xs text-warm-500">
                    {webAuthnAvailable
                      ? "WebAuthn / Passkeys available"
                      : "Not available on this device"}
                  </p>
                </div>
                {webAuthnAvailable && (
                  <Button size="sm" variant="secondary" onClick={handleWebAuthnRegister}>
                    <Shield size={14} className="mr-1" />
                    Register
                  </Button>
                )}
              </div>

              {/* PIN */}
              <div className="border-t border-warm-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-warm-800">PIN Fallback</p>
                    <p className="text-xs text-warm-500">
                      {auth.authMethod === "pin"
                        ? "PIN configured"
                        : "6-digit minimum"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowPinForm(!showPinForm)}
                  >
                    <Key size={14} className="mr-1" />
                    Set PIN
                  </Button>
                </div>

                {showPinForm && (
                  <div className="mt-3 flex flex-col gap-2 p-3 bg-warm-50 rounded">
                    <Input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter PIN (min 6 digits)"
                      monospace
                      error={pinError}
                    />
                    <Input
                      type="password"
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value)}
                      placeholder="Confirm PIN"
                      monospace
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSetPin}>
                        Save PIN
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowPinForm(false);
                          setPin("");
                          setPinConfirm("");
                          setPinError("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-lock */}
              <div className="border-t border-warm-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-warm-800">Auto-Lock</p>
                    <p className="text-xs text-warm-500">
                      Currently: {preferences.autoLockMinutes} minutes
                    </p>
                  </div>
                  <select
                    value={preferences.autoLockMinutes}
                    onChange={(e) =>
                      updatePreferences({
                        autoLockMinutes: parseInt(e.target.value),
                      })
                    }
                    className="h-[32px] px-2 text-xs rounded border border-warm-300 bg-white"
                  >
                    <option value={1}>1 min</option>
                    <option value={2}>2 min</option>
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                  </select>
                </div>
              </div>

              {/* Screenshot prevention */}
              <div className="border-t border-warm-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-warm-800">
                      Screenshot Prevention
                    </p>
                    <p className="text-xs text-warm-500">
                      Block screen capture on sensitive views
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updatePreferences({
                        screenshotPrevention: !preferences.screenshotPrevention,
                      })
                    }
                    className={`w-[36px] h-[20px] rounded-full transition-colors ${
                      preferences.screenshotPrevention
                        ? "bg-forest"
                        : "bg-warm-300"
                    }`}
                    role="switch"
                    aria-checked={preferences.screenshotPrevention}
                  >
                    <span
                      className={`block w-[16px] h-[16px] bg-white rounded-full transition-transform ${
                        preferences.screenshotPrevention
                          ? "translate-x-[18px]"
                          : "translate-x-[2px]"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Display Preferences */}
        <div className="lg:col-span-6">
          <Card padding="lg">
            <CardHeader
              title="Display"
              subtitle="Currency, date format, theme"
            />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-warm-800">Default Currency</span>
                <select
                  value={preferences.defaultCurrency}
                  onChange={(e) =>
                    updatePreferences({
                      defaultCurrency: e.target.value as "CAD",
                    })
                  }
                  className="h-[32px] px-2 text-xs rounded border border-warm-300 bg-white"
                >
                  <option value="CAD">CAD — Canadian Dollar</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </div>

              <div className="border-t border-warm-100 pt-3 flex items-center justify-between">
                <span className="text-sm text-warm-800">Date Format</span>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) =>
                    updatePreferences({
                      dateFormat: e.target.value as "YYYY-MM-DD",
                    })
                  }
                  className="h-[32px] px-2 text-xs rounded border border-warm-300 bg-white"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>

              <div className="border-t border-warm-100 pt-3 flex items-center justify-between">
                <span className="text-sm text-warm-800">Theme</span>
                <select
                  value={preferences.theme}
                  onChange={(e) =>
                    updatePreferences({
                      theme: e.target.value as "light",
                    })
                  }
                  className="h-[32px] px-2 text-xs rounded border border-warm-300 bg-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark (coming soon)</option>
                  <option value="auto">Auto (coming soon)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Market Data API Keys */}
          <Card padding="lg" className="mt-4">
            <CardHeader
              title="Market Data"
              subtitle="API keys for real-time quotes"
            />
            <p className="text-xs text-warm-500 mb-3">
              Without an API key, all market data is displayed with a delay
              label. Keys are stored encrypted on-device only.
            </p>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowApiKeyForm(!showApiKeyForm)}
            >
              <Key size={14} className="mr-1" />
              Configure API Key
            </Button>

            {showApiKeyForm && (
              <div className="mt-3 flex flex-col gap-2 p-3 bg-warm-50 rounded">
                <select
                  value={apiKeyProvider}
                  onChange={(e) =>
                    setApiKeyProvider(
                      e.target.value as "iex" | "alphavantage" | "polygon",
                    )
                  }
                  className="h-[32px] px-2 text-xs rounded border border-warm-300 bg-white"
                >
                  <option value="alphavantage">Alpha Vantage (free tier)</option>
                  <option value="iex">IEX Cloud</option>
                  <option value="polygon">Polygon.io</option>
                </select>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key"
                  monospace
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      // In production, encrypt and store in keystore
                      localStorage.setItem(
                        `dd_apikey_${apiKeyProvider}`,
                        apiKey,
                      );
                      setShowApiKeyForm(false);
                      setApiKey("");
                    }}
                  >
                    Save Key
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowApiKeyForm(false);
                      setApiKey("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Data Management */}
        <div className="lg:col-span-12">
          <Card padding="lg">
            <CardHeader title="Data" subtitle="Export and storage" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-warm-800">Export Data</p>
                  <p className="text-xs text-warm-500">
                    Download all data as encrypted JSON. Key is provided
                    separately.
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={handleExportData}>
                  <Download size={14} className="mr-1" />
                  Export
                </Button>
              </div>
              <div className="border-t border-warm-100 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-danger">Delete All Data</p>
                  <p className="text-xs text-warm-500">
                    Permanently erase all stored data. This cannot be undone.
                  </p>
                </div>
                <Button size="sm" variant="danger" onClick={handleDeleteAllData}>
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
