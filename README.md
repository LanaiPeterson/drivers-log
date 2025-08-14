# 🚛 Truck Driver Hours Log Application

A comprehensive web-based application for truck drivers to track their hours and maintain DOT compliance. This application helps drivers log their on-duty, driving, off-duty, and sleeper berth hours while automatically checking for Hours of Service (HOS) violations.

## 📸 Screenshots

### Login Screen
![Login Screen](screenshots/login-screen.png)
*Clean, professional login interface with driver registration option*

### Main Dashboard
![Main Dashboard](screenshots/main-dashboard.png)
*Real-time hour tracking with status buttons and compliance monitoring*

### Hours Summary
![Hours Summary](screenshots/hours-summary.png)
*Visual dashboard showing daily totals with color-coded warnings*

### History View
![History View](screenshots/history-view.png)
*Historical reporting with date range selection and violation tracking*

> **Note**: To add screenshots, create a `screenshots/` folder in your project directory and add PNG images with the names shown above.

## 🎯 Quick Demo

Here's what you'll see when using the application:

```
🚛 Driver Hours Log
┌─────────────────────────────────────┐
│  Welcome, John Smith        [Logout]│
└─────────────────────────────────────┘

Current Status: [On Duty] [Driving] [Off Duty] [Sleeper] [Break]
Status: Driving | Started at: 08:30 (2:15)

Today's Hours Summary:
┌──────────┬──────────┬──────────┬──────────┐
│ On Duty  │ Driving  │ Off Duty │ Sleeper  │
│  10:15   │   7:30   │   8:00   │   0:00   │
│Max: 14h  │Max: 11h  │          │          │
└──────────┴──────────┴──────────┴──────────┘

30-Minute Break Status: ✅ Compliant

[Add Manual Entry] [View History] [Clear Today's Log]

Log Entries:
• 06:00 - 08:00 (2:00) Off Duty
• 08:00 - 08:30 (0:30) On Duty  
• 08:30 - 10:45 (2:15) Driving ← Current
```

## 📋 Table of Contents

- [Screenshots](#screenshots)
- [Features](#features)
- [DOT Compliance](#dot-compliance)
- [Installation](#installation)
- [Usage](#usage)
- [User Authentication](#user-authentication)
- [Hour Tracking](#hour-tracking)
- [Violation Monitoring](#violation-monitoring)
- [Data Management](#data-management)
- [Browser Compatibility](#browser-compatibility)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🔐 User Authentication System
- **Driver Registration**: Create secure accounts with unique Driver IDs
- **Login/Logout**: Password-protected access to individual logs
- **Multi-User Support**: Each driver maintains their own private log data
- **Session Management**: Automatic login state preservation

### ⏱️ Real-Time Hour Tracking
- **Status Buttons**: Quick switching between duty statuses:
  - On Duty (non-driving)
  - Driving
  - Off Duty
  - Sleeper Berth
  - 30-Minute Break
- **Live Timer**: Real-time tracking of current session duration
- **Automatic Logging**: Seamless transition between statuses with automatic time calculation

### 📊 Hours Summary Dashboard
- **Daily Totals**: Visual display of hours for each status type
- **Limit Indicators**: Shows maximum allowed hours (11 driving, 14 on-duty)
- **Color-Coded Warnings**: Yellow for approaching limits, red for violations
- **Break Status**: 30-minute break compliance indicator

### 📝 Manual Entry System
- **Add Missed Time**: Manually add log entries for forgotten periods
- **Time Validation**: Ensures logical start/end times
- **Location Tracking**: Optional location and remarks fields
- **Flexible Corrections**: Edit historical data as needed

### 📈 Historical Reporting
- **Date Range Selection**: View logs for any date range
- **Summary Tables**: Tabular view of daily totals
- **Violation History**: Track compliance issues over time
- **Export Ready**: Data formatted for easy review

### 🚨 Violation Monitoring
- **Real-Time Alerts**: Immediate warnings for HOS violations
- **Multiple Check Types**:
  - 11-hour driving limit
  - 14-hour on-duty limit
  - 30-minute break requirement after 8 hours driving
- **Visual Indicators**: Color-coded alerts with clear messaging

## 🛡️ DOT Compliance

This application helps maintain compliance with Federal Motor Carrier Safety Administration (FMCSA) Hours of Service regulations:

- **11-Hour Driving Limit**: Maximum 11 hours of driving after 10 consecutive hours off duty
- **14-Hour On-Duty Limit**: Maximum 14-hour work period (driving + on-duty time)
- **30-Minute Break Rule**: Required 30-minute break after 8 cumulative hours of driving
- **Automatic Violation Detection**: Real-time monitoring and alerts

## 🚀 Installation

### Option 1: Simple Setup
1. Download all files to a folder on your computer
2. Open `index.html` in any modern web browser
3. No server or installation required!

### Option 2: Local Server (Recommended)
```bash
# If you have Python installed:
python -m http.server 8000

# If you have Node.js installed:
npx http-server

# Then open: http://localhost:8000
```

### File Structure
```
Drivers-log/
├── index.html          # Main application file
├── styles.css          # Application styling
├── script.js           # Application logic
└── README.md          # This documentation
```

## 📱 Usage

### Getting Started

1. **First Time Setup**:
   - Open the application in your web browser
   - Click "New Driver? Register"
   - Fill in your information:
     - Driver ID (unique identifier)
     - Full Name
     - Password (minimum 6 characters)
     - CDL License Number
   - Click "Register"

2. **Logging In**:
   - Enter your Driver ID and Password
   - Click "Login"

### Daily Operations

1. **Start Your Day**:
   - The application defaults to "Off Duty" status
   - Click the appropriate status button when you begin work
   - Time tracking starts automatically

2. **Changing Status**:
   - Click any status button to change your current activity
   - Previous session is automatically logged
   - New session timer begins

3. **Monitor Your Hours**:
   - View real-time totals in the Hours Summary section
   - Watch for color warnings (yellow = approaching limit, red = violation)
   - Check 30-minute break status

4. **Add Manual Entries**:
   - Click "Add Manual Entry" for forgotten time periods
   - Fill in status, start time, end time, and optional details
   - Click "Add Entry"

5. **View History**:
   - Click "View History" to see past logs
   - Select date range and click "Load History"
   - Review daily totals and violations

## 🔐 User Authentication

### Registration Process
- **Driver ID**: Must be unique across all users
- **Password**: Minimum 6 characters for security
- **Full Name**: For identification purposes
- **CDL License**: Professional verification

### Security Features
- Password protection for all accounts
- Individual data isolation (drivers can't see each other's data)
- Session management with automatic logout capability
- Local storage encryption (browser-based)

### Multi-User Environment
- Support for unlimited drivers on the same computer
- Each driver maintains separate, private logs
- No data mixing between accounts
- Easy switching between driver accounts

## ⏰ Hour Tracking

### Status Types

| Status | Description | DOT Impact |
|--------|-------------|------------|
| **On Duty** | Working but not driving | Counts toward 14-hour limit |
| **Driving** | Operating the vehicle | Counts toward both 11-hour and 14-hour limits |
| **Off Duty** | Not working, personal time | Resets duty periods |
| **Sleeper Berth** | Rest in approved sleeper | Can split rest periods |
| **30 Min Break** | Required break period | Resets 8-hour driving requirement |

### Automatic Calculations
- **Real-time totals**: Hours update as you work
- **Cross-day tracking**: Handles shifts that cross midnight
- **Precise timing**: Minute-level accuracy
- **Status validation**: Ensures logical time sequences

## 🚨 Violation Monitoring

### Real-Time Alerts
The application continuously monitors for violations and displays:

- **🚨 CRITICAL VIOLATIONS**:
  - Exceeded 11-hour driving limit
  - Exceeded 14-hour on-duty limit
  - Missing required 30-minute break

- **⚠️ WARNINGS**:
  - Approaching 11-hour driving limit (10+ hours)
  - Approaching 14-hour on-duty limit (13+ hours)
  - Need for 30-minute break (8+ hours driving)

### Visual Indicators
- **Red Cards**: Hours summary cards turn red when limits exceeded
- **Yellow Cards**: Warning color when approaching limits
- **Alert Banners**: Prominent violation messages at bottom of screen
- **Status Icons**: ✅ compliant, ❌ violation required

## 💾 Data Management

### Storage System
- **Local Storage**: All data stored in browser's local storage
- **User-Specific**: Data organized by Driver ID and date
- **Automatic Saving**: Changes saved immediately
- **Offline Capable**: Works without internet connection

### Data Format
```javascript
// Example data structure
{
  date: "2025-08-14",
  driverId: "DRIVER001",
  driverName: "John Smith",
  dailyHours: {
    "on-duty": 8.5,
    "driving": 7.0,
    "off-duty": 10.0,
    "sleeper": 0,
    "break": 0.5
  },
  logEntries: [...], // Detailed time entries
  hasThirtyMinuteBreak: true,
  drivingHoursSinceBreak: 3.5
}
```

### Backup and Recovery
- **Manual Export**: View history feature shows all data
- **Browser Backup**: Data persists across browser sessions
- **Multi-Device**: Each device maintains its own data copy

## 🌐 Browser Compatibility

### Supported Browsers
- ✅ **Chrome** 60+
- ✅ **Firefox** 55+
- ✅ **Safari** 12+
- ✅ **Edge** 79+

### Required Features
- Local Storage support
- ES6 JavaScript features
- CSS Grid and Flexbox
- Date/Time input types

### Mobile Support
- 📱 **Responsive Design**: Works on phones and tablets
- 🔧 **Touch Friendly**: Large buttons and touch targets
- 📊 **Mobile Optimized**: Layouts adapt to screen size

## 🔧 Technical Details

### Technologies Used
- **HTML5**: Semantic markup and modern input types
- **CSS3**: Grid, Flexbox, and responsive design
- **Vanilla JavaScript**: No external dependencies
- **Local Storage API**: Client-side data persistence
- **Web Standards**: Progressive enhancement approach

### Performance Features
- **Lightweight**: No external libraries or frameworks
- **Fast Loading**: Minimal file sizes
- **Efficient Updates**: Only DOM elements that change are updated
- **Memory Management**: Proper cleanup of event listeners and timers

## 📋 Troubleshooting

### Common Issues

1. **Login Not Working**:
   - Check that Driver ID and password are correct
   - Ensure JavaScript is enabled in your browser
   - Try refreshing the page

2. **Data Not Saving**:
   - Check browser storage settings
   - Ensure local storage is not disabled
   - Clear browser cache if needed

3. **Time Not Tracking**:
   - Make sure you've clicked a status button
   - Check that the page hasn't been closed
   - Verify browser tab is active

4. **History Not Loading**:
   - Select valid date range
   - Ensure dates are in correct order
   - Check that data exists for selected period

### Support
For technical issues or questions:
- Check browser console for error messages
- Ensure browser meets minimum requirements
- Verify all files are present and accessible

## 🔄 Future Enhancements

Planned features for future versions:
- PDF report generation
- GPS location tracking
- Cloud backup and sync
- Fleet management features
- Advanced reporting and analytics
- Integration with ELD systems

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Disclaimer**: This application is designed to assist with DOT compliance but should not be considered a replacement for official ELD (Electronic Logging Device) systems where required by law. Always consult with transportation authorities and legal counsel regarding regulatory compliance.

For questions or support, please refer to the troubleshooting section above or consult with your fleet manager.
