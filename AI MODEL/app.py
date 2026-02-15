* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.app-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.app-header h1 {
  color: #667eea;
  font-size: 2.5em;
  margin-bottom: 5px;
}

.app-header p {
  color: #666;
  font-size: 1.1em;
}

.user-info {
  position: absolute;
  top: 20px;
  right: 20px;
  background: #667eea;
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: bold;
}

/* Navigation */
.nav-bar {
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.nav-bar button {
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s;
}

.nav-bar button:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 30px 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.view-container {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.view-container h2 {
  color: #667eea;
  margin-bottom: 20px;
  font-size: 2em;
}

/* Info Box */
.info-box {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin: 20px 0;
}

.info-box h3 {
  color: #667eea;
  margin-bottom: 15px;
}

.info-box ol {
  margin-left: 20px;
}

.info-box ol li {
  margin: 10px 0;
  line-height: 1.6;
}

/* Forms */
.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 600px;
}

.form input,
.form select,
.form textarea {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  transition: border 0.3s;
}

.form input:focus,
.form select:focus,
.form textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: bold;
  color: #333;
}

/* Buttons */
.btn-primary,
.cta-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.btn-primary:hover,
.cta-button:hover {
  background: #764ba2;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.cta-button {
  margin-top: 20px;
  display: inline-block;
}

/* Dashboard Cards */
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 15px;
  cursor: pointer;
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.card h3 {
  margin-bottom: 10px;
  font-size: 1.5em;
}

/* User Profile */
.user-profile {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
}

.user-profile h3 {
  color: #667eea;
  margin-bottom: 15px;
}

.user-profile p {
  margin: 8px 0;
  line-height: 1.6;
}

/* Matches */
.matches-list {
  display: grid;
  gap: 20px;
  margin-top: 20px;
}

.match-card {
  border: 2px solid #667eea;
  border-radius: 10px;
  padding: 20px;
  background: #f8f9fa;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.match-header h3 {
  color: #667eea;
}

.match-score {
  background: #667eea;
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: bold;
}

.match-card p {
  margin: 8px 0;
  line-height: 1.6;
}

.btn-contact {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
  font-size: 1em;
}

.btn-contact:hover {
  background: #218838;
}

.no-matches {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-matches p {
  margin: 10px 0;
  font-size: 1.1em;
}

/* Community Board */
.community-section {
  margin: 30px 0;
}

.community-section h3 {
  color: #667eea;
  margin-bottom: 15px;
  font-size: 1.5em;
}

.community-list {
  display: grid;
  gap: 15px;
}

.community-item {
  padding: 15px;
  border-radius: 10px;
  border-left: 5px solid;
}

.request-item {
  background: #fff3cd;
  border-color: #ffc107;
}

.offer-item {
  background: #d4edda;
  border-color: #28a745;
}

.community-item p {
  margin: 5px 0;
}

.meta {
  font-size: 0.9em;
  color: #666;
  margin-top: 10px;
}

.urgency-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 0.8em;
  font-weight: bold;
  margin-right: 10px;
}

.urgency-badge.critical {
  background: #dc3545;
  color: white;
}

.urgency-badge.high {
  background: #fd7e14;
  color: white;
}

.urgency-badge.medium {
  background: #ffc107;
  color: #333;
}

.urgency-badge.low {
  background: #28a745;
  color: white;
}

/* Footer */
.app-footer {
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  text-align: center;
  color: #666;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .app-header h1 {
    font-size: 1.8em;
  }
  
  .nav-bar {
    flex-direction: column;
  }
  
  .nav-bar button {
    width: 100%;
  }
  
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
  
  .user-info {
    position: static;
    margin-top: 10px;
    display: inline-block;
  }
}