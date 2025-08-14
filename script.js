class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
    }

    loadUsers() {
        try {
            const users = localStorage.getItem('driversLog_users');
            return users ? JSON.parse(users) : {};
        } catch (error) {
            console.error('Error loading users:', error);
            return {};
        }
    }

    saveUsers() {
        try {
            localStorage.setItem('driversLog_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Error saving users:', error);
            alert('Unable to save user data. Please check your browser storage settings.');
        }
    }

    register(driverId, driverName, password, licenseNumber) {
        if (this.users[driverId]) {
            throw new Error('Driver ID already exists');
        }

        this.users[driverId] = {
            id: driverId,
            name: driverName,
            password: password, // In production, this should be hashed
            licenseNumber: licenseNumber,
            registeredDate: new Date().toISOString()
        };

        this.saveUsers();
        return true;
    }

    login(driverId, password) {
        const user = this.users[driverId];
        if (!user || user.password !== password) {
            throw new Error('Invalid driver ID or password');
        }

        this.currentUser = user;
        localStorage.setItem('driversLog_currentUser', JSON.stringify(user));
        return user;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('driversLog_currentUser');
    }

    getCurrentUser() {
        if (!this.currentUser) {
            try {
                const savedUser = localStorage.getItem('driversLog_currentUser');
                if (savedUser) {
                    this.currentUser = JSON.parse(savedUser);
                }
            } catch (error) {
                console.error('Error loading current user:', error);
                this.currentUser = null;
            }
        }
        return this.currentUser;
    }

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
}

class DriversLog {
    constructor() {
        this.authSystem = new AuthSystem();
        this.currentStatus = 'off-duty';
        this.statusStartTime = null;
        this.dailyHours = {
            'on-duty': 0,
            'driving': 0,
            'off-duty': 0,
            'sleeper': 0,
            'break': 0
        };
        this.logEntries = [];
        this.hasThirtyMinuteBreak = false;
        this.drivingHoursSinceBreak = 0;
        this.intervalId = null;
        this.eventListenersSetup = false; // Track if event listeners are setup
        
        this.init();
    }

    init() {
        this.setupAuthEventListeners();
        
        if (this.authSystem.isLoggedIn()) {
            this.showMainApp();
            this.setupMainAppEventListeners();
            this.loadTodaysData();
            this.setCurrentDate();
            this.startTimeTracking();
            this.checkViolations();
        } else {
            this.showLoginScreen();
        }
    }

    setupAuthEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Registration modal
        const registerBtn = document.getElementById('registerBtn');
        const registrationModal = document.getElementById('registrationModal');
        const registerClose = document.getElementById('registerClose');
        const registrationForm = document.getElementById('registrationForm');

        registerBtn.addEventListener('click', () => {
            registrationModal.style.display = 'block';
        });

        registerClose.addEventListener('click', () => {
            registrationModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === registrationModal) {
                registrationModal.style.display = 'none';
            }
        });

        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    handleLogin() {
        const driverId = document.getElementById('loginDriverId').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            this.authSystem.login(driverId, password);
            this.showMainApp();
            this.setupMainAppEventListeners();
            this.loadTodaysData();
            this.setCurrentDate();
            this.startTimeTracking();
            this.checkViolations();
        } catch (error) {
            alert(error.message);
        }
    }

    handleRegistration() {
        const driverId = document.getElementById('regDriverId').value.trim();
        const driverName = document.getElementById('regDriverName').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const licenseNumber = document.getElementById('regLicenseNumber').value.trim();

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        try {
            this.authSystem.register(driverId, driverName, password, licenseNumber);
            alert('Registration successful! You can now log in.');
            document.getElementById('registrationModal').style.display = 'none';
            document.getElementById('registrationForm').reset();
        } catch (error) {
            alert(error.message);
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to log out? Any unsaved time will be lost.')) {
            // Save current session before logging out
            if (this.statusStartTime) {
                this.logStatusChange(this.currentStatus, this.statusStartTime, new Date());
            }
            this.saveTodaysData();
            
            // Clear interval
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
            
            // Clean up event listeners
            this.cleanupEventListeners();
            
            this.authSystem.logout();
            this.showLoginScreen();
            
            // Reset app state
            this.resetAppState();
        }
    }

    cleanupEventListeners() {
        // Remove window event listeners to prevent memory leaks
        if (this.modalClickHandler) {
            window.removeEventListener('click', this.modalClickHandler);
            this.modalClickHandler = null;
        }
        if (this.historyModalClickHandler) {
            window.removeEventListener('click', this.historyModalClickHandler);
            this.historyModalClickHandler = null;
        }
        this.eventListenersSetup = false;
    }

    resetAppState() {
        this.currentStatus = 'off-duty';
        this.statusStartTime = null;
        this.dailyHours = {
            'on-duty': 0,
            'driving': 0,
            'off-duty': 0,
            'sleeper': 0,
            'break': 0
        };
        this.logEntries = [];
        this.hasThirtyMinuteBreak = false;
        this.drivingHoursSinceBreak = 0;
        this.intervalId = null;
    }

    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        const user = this.authSystem.getCurrentUser();
        if (user) {
            document.getElementById('loggedInUser').textContent = user.name;
            document.getElementById('currentDriverId').textContent = user.id;
        }
    }

    setupEventListeners() {
        // This method is now renamed to setupMainAppEventListeners to avoid confusion
        // and will only be called once when logging in
    }

    setupMainAppEventListeners() {
        // Prevent duplicate event listeners
        if (this.eventListenersSetup) return;
        this.eventListenersSetup = true;

        // Status buttons
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.target.dataset.status;
                this.changeStatus(status);
            });
        });

        // Modal controls
        const modal = document.getElementById('manualEntryModal');
        const addEntryBtn = document.getElementById('addEntryBtn');
        const closeModal = document.querySelector('#manualEntryModal .close'); // More specific selector
        const manualEntryForm = document.getElementById('manualEntryForm');

        if (addEntryBtn) {
            addEntryBtn.addEventListener('click', () => {
                modal.style.display = 'block';
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // Window click handler for modal
        this.modalClickHandler = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        window.addEventListener('click', this.modalClickHandler);

        if (manualEntryForm) {
            manualEntryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addManualEntry();
            });
        }

        // Clear log button
        const clearLogBtn = document.getElementById('clearLogBtn');
        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear today\'s log? This action cannot be undone.')) {
                    this.clearTodaysLog();
                }
            });
        }

        // History button
        const viewHistoryBtn = document.getElementById('viewHistoryBtn');
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => {
                this.showHistory();
            });
        }

        // History modal controls
        const historyModal = document.getElementById('historyModal');
        const historyClose = document.getElementById('historyClose');
        const loadHistoryBtn = document.getElementById('loadHistoryBtn');

        if (historyClose) {
            historyClose.addEventListener('click', () => {
                historyModal.style.display = 'none';
            });
        }

        // History modal click handler
        this.historyModalClickHandler = (e) => {
            if (e.target === historyModal) {
                historyModal.style.display = 'none';
            }
        };
        window.addEventListener('click', this.historyModalClickHandler);

        if (loadHistoryBtn) {
            loadHistoryBtn.addEventListener('click', () => {
                this.loadHistory();
            });
        }

        // Driver name and date inputs - removed driver name since it's handled by auth
        const currentDateInput = document.getElementById('currentDate');
        if (currentDateInput) {
            currentDateInput.addEventListener('change', () => {
                this.loadTodaysData();
            });
        }
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('currentDate').value = today;
    }

    changeStatus(newStatus) {
        if (this.currentStatus === newStatus) return;

        // Log the current status before changing
        if (this.statusStartTime) {
            this.logStatusChange(this.currentStatus, this.statusStartTime, new Date());
        }

        // Update status
        this.currentStatus = newStatus;
        this.statusStartTime = new Date();

        // Update UI
        this.updateStatusUI();
        this.saveTodaysData();
    }

    updateStatusUI() {
        // Update button states
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-status="${this.currentStatus}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Update status text
        const statusTextElement = document.getElementById('currentStatusText');
        const statusTimeElement = document.getElementById('statusStartTime');
        
        if (statusTextElement) {
            const statusText = this.getStatusDisplayName(this.currentStatus);
            statusTextElement.textContent = statusText;
        }
        
        if (statusTimeElement) {
            const timeString = this.statusStartTime ? 
                this.statusStartTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                '--:--';
            statusTimeElement.textContent = timeString;
        }
    }

    getStatusDisplayName(status) {
        const statusNames = {
            'on-duty': 'On Duty',
            'driving': 'Driving',
            'off-duty': 'Off Duty',
            'sleeper': 'Sleeper Berth',
            'break': '30 Min Break'
        };
        return statusNames[status] || status;
    }

    logStatusChange(status, startTime, endTime) {
        const duration = (endTime - startTime) / (1000 * 60 * 60); // Convert to hours
        
        const entry = {
            id: Date.now() + Math.random(),
            status: status,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            location: '', // Could be enhanced with GPS
            remarks: ''
        };

        this.logEntries.push(entry);
        this.updateDailyHours(status, duration);
        this.updateLogDisplay();
        this.checkBreakRequirement(status, duration);
        this.checkViolations();
    }

    updateDailyHours(status, duration) {
        this.dailyHours[status] += duration;
        
        // If it's driving time, also add to on-duty time
        if (status === 'driving') {
            this.dailyHours['on-duty'] += duration;
        }
        
        this.updateHoursDisplay();
    }

    updateHoursDisplay() {
        const onDutyElement = document.getElementById('onDutyHours');
        const drivingElement = document.getElementById('drivingHours');
        const offDutyElement = document.getElementById('offDutyHours');
        const sleeperElement = document.getElementById('sleeperHours');
        
        if (onDutyElement) onDutyElement.textContent = this.formatHours(this.dailyHours['on-duty']);
        if (drivingElement) drivingElement.textContent = this.formatHours(this.dailyHours['driving']);
        if (offDutyElement) offDutyElement.textContent = this.formatHours(this.dailyHours['off-duty']);
        if (sleeperElement) sleeperElement.textContent = this.formatHours(this.dailyHours['sleeper']);

        // Add warning/violation classes
        this.updateHoursCardStatus('onDutyHours', this.dailyHours['on-duty'], 14);
        this.updateHoursCardStatus('drivingHours', this.dailyHours['driving'], 11);
    }

    updateHoursCardStatus(elementId, hours, maxHours) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const card = element.closest('.hours-card');
        if (!card) return;
        
        card.classList.remove('warning', 'violation');
        
        if (hours >= maxHours) {
            card.classList.add('violation');
        } else if (hours >= maxHours - 1) {
            card.classList.add('warning');
        }
    }

    formatHours(hours) {
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        return `${h}:${m.toString().padStart(2, '0')}`;
    }

    checkBreakRequirement(status, duration) {
        if (status === 'driving') {
            this.drivingHoursSinceBreak += duration;
        } else if (status === 'break' && duration >= 0.5) { // 30 minutes
            this.hasThirtyMinuteBreak = true;
            this.drivingHoursSinceBreak = 0;
        } else if (status === 'off-duty' && duration >= 0.5) {
            // Off-duty time can also count as break
            this.drivingHoursSinceBreak = 0;
        }

        this.updateBreakStatus();
    }

    updateBreakStatus() {
        const breakIndicator = document.getElementById('breakIndicator');
        const breakStatus = document.getElementById('breakStatus');

        if (!breakIndicator || !breakStatus) return;

        if (this.drivingHoursSinceBreak >= 8 && !this.hasThirtyMinuteBreak) {
            breakIndicator.textContent = '❌ Required';
            breakIndicator.className = 'break-indicator required';
            breakStatus.textContent = 'VIOLATION: Must take 30-minute break after 8 hours of driving';
        } else if (this.hasThirtyMinuteBreak || this.drivingHoursSinceBreak < 8) {
            breakIndicator.textContent = '✅ Compliant';
            breakIndicator.className = 'break-indicator completed';
            if (this.hasThirtyMinuteBreak) {
                breakStatus.textContent = '30-minute break completed';
            } else {
                breakStatus.textContent = `${this.formatHours(this.drivingHoursSinceBreak)} driving time since last break`;
            }
        }
    }

    updateLogDisplay() {
        const logList = document.getElementById('logList');
        
        if (this.logEntries.length === 0) {
            logList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No log entries for today</p>';
            return;
        }

        const sortedEntries = [...this.logEntries].sort((a, b) => b.startTime - a.startTime);
        
        logList.innerHTML = sortedEntries.map(entry => `
            <div class="log-entry">
                <div class="log-entry-header">
                    <span class="log-entry-status ${entry.status}">${this.getStatusDisplayName(entry.status)}</span>
                    <span class="log-entry-time">
                        ${entry.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        ${entry.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        (${this.formatHours(entry.duration)})
                    </span>
                </div>
                <div class="log-entry-details">
                    ${entry.location ? `Location: ${entry.location}` : ''}
                    ${entry.remarks ? ` | ${entry.remarks}` : ''}
                </div>
            </div>
        `).join('');
    }

    addManualEntry() {
        const form = document.getElementById('manualEntryForm');
        const formData = new FormData(form);
        
        const status = formData.get('entryStatus') || document.getElementById('entryStatus').value;
        const startTimeStr = formData.get('entryStartTime') || document.getElementById('entryStartTime').value;
        const endTimeStr = formData.get('entryEndTime') || document.getElementById('entryEndTime').value;
        const location = formData.get('entryLocation') || document.getElementById('entryLocation').value;
        const remarks = formData.get('entryRemarks') || document.getElementById('entryRemarks').value;

        if (!startTimeStr || !endTimeStr) {
            alert('Please fill in both start and end times');
            return;
        }

        const today = new Date();
        const startTime = new Date(today.toDateString() + ' ' + startTimeStr);
        const endTime = new Date(today.toDateString() + ' ' + endTimeStr);

        if (endTime <= startTime) {
            alert('End time must be after start time');
            return;
        }

        const duration = (endTime - startTime) / (1000 * 60 * 60);

        const entry = {
            id: Date.now() + Math.random(),
            status: status,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            location: location,
            remarks: remarks
        };

        this.logEntries.push(entry);
        this.updateDailyHours(status, duration);
        this.updateLogDisplay();
        this.checkBreakRequirement(status, duration);
        this.checkViolations();
        this.saveTodaysData();

        // Close modal and reset form
        document.getElementById('manualEntryModal').style.display = 'none';
        form.reset();
    }

    checkViolations() {
        const alertsContainer = document.getElementById('violationAlerts');
        alertsContainer.innerHTML = '';

        const violations = [];

        // Check driving time violation (11 hours)
        if (this.dailyHours['driving'] >= 11) {
            violations.push('🚨 VIOLATION: Exceeded 11-hour driving limit');
        }

        // Check on-duty time violation (14 hours)
        if (this.dailyHours['on-duty'] >= 14) {
            violations.push('🚨 VIOLATION: Exceeded 14-hour on-duty limit');
        }

        // Check 30-minute break violation
        if (this.drivingHoursSinceBreak >= 8 && !this.hasThirtyMinuteBreak) {
            violations.push('⚠️ VIOLATION: Must take 30-minute break after 8 hours of driving');
        }

        // Check warnings
        if (this.dailyHours['driving'] >= 10 && this.dailyHours['driving'] < 11) {
            violations.push('⚠️ WARNING: Approaching 11-hour driving limit');
        }

        if (this.dailyHours['on-duty'] >= 13 && this.dailyHours['on-duty'] < 14) {
            violations.push('⚠️ WARNING: Approaching 14-hour on-duty limit');
        }

        violations.forEach(violation => {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'violation-alert';
            alertDiv.innerHTML = `<span class="violation-icon">${violation.includes('🚨') ? '🚨' : '⚠️'}</span>${violation}`;
            alertsContainer.appendChild(alertDiv);
        });
    }

    startTimeTracking() {
        // Clear any existing interval first
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // Update current session time every minute
        this.intervalId = setInterval(() => {
            if (this.statusStartTime) {
                const currentTime = new Date();
                const sessionDuration = (currentTime - this.statusStartTime) / (1000 * 60 * 60);
                
                // Update display to show current session time
                const statusElement = document.getElementById('statusStartTime');
                if (statusElement) {
                    const startTimeStr = this.statusStartTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    const sessionStr = this.formatHours(sessionDuration);
                    statusElement.textContent = `${startTimeStr} (${sessionStr})`;
                }
            }
        }, 60000); // Update every minute
    }

    saveTodaysData() {
        const date = document.getElementById('currentDate').value;
        const user = this.authSystem.getCurrentUser();
        
        if (!user) return;
        
        const data = {
            date: date,
            driverId: user.id,
            driverName: user.name,
            currentStatus: this.currentStatus,
            statusStartTime: this.statusStartTime ? this.statusStartTime.toISOString() : null,
            dailyHours: this.dailyHours,
            logEntries: this.logEntries.map(entry => ({
                ...entry,
                startTime: entry.startTime.toISOString(),
                endTime: entry.endTime.toISOString()
            })),
            hasThirtyMinuteBreak: this.hasThirtyMinuteBreak,
            drivingHoursSinceBreak: this.drivingHoursSinceBreak
        };

        localStorage.setItem(`driversLog_${user.id}_${date}`, JSON.stringify(data));
    }

    loadTodaysData() {
        const date = document.getElementById('currentDate').value;
        const user = this.authSystem.getCurrentUser();
        
        if (!user) return;
        
        const savedData = localStorage.getItem(`driversLog_${user.id}_${date}`);

        if (savedData) {
            const data = JSON.parse(savedData);
            
            this.currentStatus = data.currentStatus || 'off-duty';
            this.statusStartTime = data.statusStartTime ? new Date(data.statusStartTime) : null;
            this.dailyHours = data.dailyHours || {
                'on-duty': 0,
                'driving': 0,
                'off-duty': 0,
                'sleeper': 0,
                'break': 0
            };
            this.logEntries = (data.logEntries || []).map(entry => ({
                ...entry,
                startTime: new Date(entry.startTime),
                endTime: new Date(entry.endTime)
            }));
            this.hasThirtyMinuteBreak = data.hasThirtyMinuteBreak || false;
            this.drivingHoursSinceBreak = data.drivingHoursSinceBreak || 0;
        } else {
            // Reset to defaults
            this.resetAppState();
        }

        this.updateStatusUI();
        this.updateHoursDisplay();
        this.updateLogDisplay();
        this.updateBreakStatus();
        this.checkViolations();
    }

    clearTodaysLog() {
        const date = document.getElementById('currentDate').value;
        const user = this.authSystem.getCurrentUser();
        
        if (!user) return;
        
        localStorage.removeItem(`driversLog_${user.id}_${date}`);
        
        // Reset current session
        this.resetAppState();
        this.updateStatusUI();
        this.updateHoursDisplay();
        this.updateLogDisplay();
        this.updateBreakStatus();
        this.checkViolations();
    }

    showHistory() {
        const historyModal = document.getElementById('historyModal');
        if (!historyModal) return;
        
        historyModal.style.display = 'block';
        
        // Set default date range (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const startDateInput = document.getElementById('historyStartDate');
        const endDateInput = document.getElementById('historyEndDate');
        
        if (startDateInput) startDateInput.value = startDate.toISOString().split('T')[0];
        if (endDateInput) endDateInput.value = endDate.toISOString().split('T')[0];
    }

    loadHistory() {
        const startDate = document.getElementById('historyStartDate').value;
        const endDate = document.getElementById('historyEndDate').value;
        const user = this.authSystem.getCurrentUser();
        
        if (!user || !startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            alert('Start date must be before end date');
            return;
        }
        
        const historyContent = document.getElementById('historyContent');
        const historyData = [];
        
        // Load data for each day in the range
        const currentDate = new Date(startDate);
        const endDateTime = new Date(endDate);
        
        while (currentDate <= endDateTime) {
            const dateString = currentDate.toISOString().split('T')[0];
            const savedData = localStorage.getItem(`driversLog_${user.id}_${dateString}`);
            
            if (savedData) {
                const data = JSON.parse(savedData);
                historyData.push({
                    date: dateString,
                    ...data
                });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        if (historyData.length === 0) {
            historyContent.innerHTML = '<p>No data found for the selected date range.</p>';
            return;
        }
        
        // Generate history HTML
        let html = '<div class="history-summary">';
        html += '<h4>History Summary</h4>';
        html += '<table class="history-table">';
        html += '<thead><tr><th>Date</th><th>On Duty</th><th>Driving</th><th>Off Duty</th><th>Sleeper</th><th>Break</th><th>Violations</th></tr></thead>';
        html += '<tbody>';
        
        let totalOnDuty = 0;
        let totalDriving = 0;
        let totalOffDuty = 0;
        let totalSleeper = 0;
        let totalBreak = 0;
        
        historyData.forEach(dayData => {
            const violations = [];
            if (dayData.dailyHours.driving >= 11) violations.push('Driving');
            if (dayData.dailyHours['on-duty'] >= 14) violations.push('On-duty');
            
            totalOnDuty += dayData.dailyHours['on-duty'];
            totalDriving += dayData.dailyHours.driving;
            totalOffDuty += dayData.dailyHours['off-duty'];
            totalSleeper += dayData.dailyHours.sleeper;
            totalBreak += dayData.dailyHours.break;
            
            html += `<tr class="${violations.length > 0 ? 'violation-row' : ''}">`;
            html += `<td>${new Date(dayData.date).toLocaleDateString()}</td>`;
            html += `<td>${this.formatHours(dayData.dailyHours['on-duty'])}</td>`;
            html += `<td>${this.formatHours(dayData.dailyHours.driving)}</td>`;
            html += `<td>${this.formatHours(dayData.dailyHours['off-duty'])}</td>`;
            html += `<td>${this.formatHours(dayData.dailyHours.sleeper)}</td>`;
            html += `<td>${this.formatHours(dayData.dailyHours.break)}</td>`;
            html += `<td class="violations-cell">${violations.join(', ') || 'None'}</td>`;
            html += '</tr>';
        });
        
        // Add totals row
        html += `<tr class="totals-row">`;
        html += `<td><strong>TOTALS</strong></td>`;
        html += `<td><strong>${this.formatHours(totalOnDuty)}</strong></td>`;
        html += `<td><strong>${this.formatHours(totalDriving)}</strong></td>`;
        html += `<td><strong>${this.formatHours(totalOffDuty)}</strong></td>`;
        html += `<td><strong>${this.formatHours(totalSleeper)}</strong></td>`;
        html += `<td><strong>${this.formatHours(totalBreak)}</strong></td>`;
        html += `<td><strong>--</strong></td>`;
        html += '</tr>';
        
        html += '</tbody></table></div>';
        
        historyContent.innerHTML = html;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.driversLogApp = new DriversLog();
});

// Handle page visibility changes to maintain accurate time tracking
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page became visible again, refresh the display
        // This helps maintain accuracy if the browser was backgrounded
        const app = window.driversLogApp;
        if (app && app.authSystem.isLoggedIn()) {
            app.updateHoursDisplay();
            app.checkViolations();
        }
    }
});

// Prevent accidental page refresh/close if actively tracking time
window.addEventListener('beforeunload', (e) => {
    const app = window.driversLogApp;
    if (app && app.authSystem.isLoggedIn() && app.statusStartTime && app.currentStatus !== 'off-duty') {
        e.preventDefault();
        e.returnValue = 'You are currently tracking time. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// Export classes for potential future use
window.DriversLog = DriversLog;
window.AuthSystem = AuthSystem;
