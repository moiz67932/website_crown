# 🏠 Trestle API Setup Guide

## ✅ **Environment Variables Setup Complete!**

Your Trestle API credentials are now securely stored in environment variables. Here's how it works:

## 📁 **Files Structure:**

```
├── .env                    # ❗ NEVER commit this file (contains real credentials)
├── env.example            # ✅ Template file (safe to commit)
├── test-trestle-api.js    # ✅ Updated to use .env
├── debug-trestle-api.js   # ✅ Updated to use .env  
├── verify-credentials.js  # ✅ Updated to use .env
├── test-bearer-auth.js    # ✅ Updated to use .env
└── test-trestle-api.ps1   # ✅ Updated to use .env
```

## 🔧 **How to Update Credentials:**

When you get new API credentials from CoreLogic/Trestle, simply update your `.env` file:

```bash
# Open .env file in any text editor
TRESTLE_API_ID=your-new-api-id-here
TRESTLE_API_PASSWORD=your-new-password-here
TRESTLE_BASE_URL=https://api-prod.corelogic.com/trestle
```

## 🚀 **How to Run Tests:**

### **Node.js Scripts:**
```bash
node test-trestle-api.js         # Basic authentication test
node debug-trestle-api.js        # Comprehensive debug tests
node verify-credentials.js       # Credential verification
node test-bearer-auth.js         # Bearer token tests
```

### **PowerShell Script:**
```powershell
.\test-trestle-api.ps1           # Uses .env file automatically
# OR
.\test-trestle-api.ps1 -ApiId "new-id" -Password "new-password"
```

## 🛡️ **Security Features:**

✅ **Credentials hidden from code**  
✅ **`.env` file ignored by Git**  
✅ **Environment variable validation**  
✅ **Error messages don't expose credentials**  

## 📊 **Current Status:**

- **Environment Setup**: ✅ Complete
- **Scripts Updated**: ✅ All scripts now use .env
- **API Status**: ❌ Still needs CoreLogic support
- **Error Type**: 403 Forbidden (Incapsula security blocking)

## 📞 **Next Steps:**

1. **Contact CoreLogic/Trestle Support** with this information:
   - Your API ID: ``
   - Error: 403 Forbidden (Incapsula security blocking)
   - Request IP whitelisting or account activation

2. **When you get working credentials:**
   - Update `.env` file with new credentials
   - Run `node test-trestle-api.js` to verify
   - All scripts will automatically use the new credentials

## 💡 **Benefits of This Setup:**

- **Easy credential updates**: Just edit one `.env` file
- **Secure**: Credentials never committed to Git
- **Consistent**: All scripts use the same credentials
- **Professional**: Industry standard approach
- **Team-friendly**: Team members can have their own `.env` files

## 🔄 **For Your Real Estate App Integration:**

Once the API works, you can use the same pattern in your Next.js app:

```javascript
// In your API routes or hooks
const TRESTLE_API_ID = process.env.TRESTLE_API_ID;
const TRESTLE_PASSWORD = process.env.TRESTLE_API_PASSWORD;
```

The setup is complete and ready for production use! 🎉
