import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showInbox, setShowInbox] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load user and messages
  useEffect(() => {
    const savedUser = localStorage.getItem('neighboraid_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    loadMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [user]);

  const [loginForm, setLoginForm] = useState({ email: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', phone: '', address: '', radius: 1.5
  });
  const [requestForm, setRequestForm] = useState({
    resource_type: 'medicine', description: '', quantity: '', urgency: 'medium', image: null
  });
  const [offerForm, setOfferForm] = useState({
    resource_type: 'medicine', description: '', quantity: '', availability: 'Now', image: null
  });

  const [matches, setMatches] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [allOffers, setAllOffers] = useState([]);

  // Load messages
  const loadMessages = () => {
    const savedMessages = localStorage.getItem('neighboraid_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  // Send message (works both ways)
  const sendMessage = (recipientName, recipientId) => {
    if (!newMessage.trim() || !user) return;
    
    const message = {
      id: Date.now(),
      from: user.name,
      fromId: user.id,
      to: recipientName,
      toId: recipientId,
      text: newMessage,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem('neighboraid_messages', JSON.stringify(updatedMessages));
    setNewMessage('');
  };

  // Handle image upload
  const handleImageUpload = (e, formType) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (formType === 'request') {
          setRequestForm({...requestForm, image: reader.result});
        } else {
          setOfferForm({...offerForm, image: reader.result});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // View item details (NEW)
  const viewItemDetails = (item, type) => {
    setSelectedItem({...item, itemType: type});
    setShowModal(true);
  };

  // Open chat
  const openChat = (person) => {
    setCurrentChat(person);
    setShowInbox(true);
  };

  // Update radius
  const updateRadius = (newRadius) => {
    const updatedUser = { ...user, radius: newRadius };
    setUser(updatedUser);
    localStorage.setItem('neighboraid_user', JSON.stringify(updatedUser));
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/users/${loginForm.email}`);
      const data = await response.json();
      
      if (response.ok) {
        setUser(data);
        if (rememberMe) {
          localStorage.setItem('neighboraid_user', JSON.stringify(data));
        }
        setCurrentView('dashboard');
      } else {
        alert('User not found. Please register first.');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('neighboraid_user');
    setCurrentView('home');
    setNotifications([]);
  };

  // Register
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await response.json();
      
      if (response.ok) {
        const newUser = {
          ...registerForm,
          id: data.userId,
          latitude: data.latitude,
          longitude: data.longitude
        };
        setUser(newUser);
        localStorage.setItem('neighboraid_user', JSON.stringify(newUser));
        setCurrentView('dashboard');
      } else {
        alert('Registration failed: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Add notification
  const addNotification = (message) => {
    const newNotif = {
      id: Date.now(),
      message: message,
      time: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Create Request
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login first!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...requestForm
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        const matchResponse = await fetch(`http://localhost:5000/api/matches/${data.requestId}`);
        const matchData = await matchResponse.json();
        setMatches(matchData.matches);
        
        if (matchData.matches.length > 0) {
          addNotification(`Found ${matchData.matches.length} match(es) for your request`);
        }
        
        setCurrentView('matches');
        setRequestForm({...requestForm, description: '', quantity: '', image: null});
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Create Offer
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login first!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...offerForm
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        addNotification('Your offer has been posted');
        setCurrentView('dashboard');
        setOfferForm({...offerForm, description: '', quantity: '', image: null});
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Accept offer and start chat
  const handleAcceptOffer = (offer) => {
    setCurrentChat({...offer, user_id: offer.user_id || offer.id});
    setShowInbox(true);
    addNotification(`Chat opened with ${offer.name}`);
  };

  // Load community
  const loadCommunityData = async () => {
    try {
      const reqResponse = await fetch('http://localhost:5000/api/requests');
      const reqData = await reqResponse.json();
      setAllRequests(reqData);

      const offerResponse = await fetch('http://localhost:5000/api/offers');
      const offerData = await offerResponse.json();
      setAllOffers(offerData);

      setCurrentView('community');
    } catch (error) {
      alert('Error loading data: ' + error.message);
    }
  };

  // Get user messages
  const getUserMessages = () => {
    if (!user) return [];
    return messages.filter(m => m.fromId === user.id || m.toId === user.id);
  };

  // Get messages with specific person
  const getChatMessages = (personId) => {
    if (!user || !personId) return [];
    return messages.filter(m => 
      (m.fromId === user.id && m.toId === personId) ||
      (m.toId === user.id && m.fromId === personId)
    );
  };

  // Get unread count
  const getUnreadCount = () => {
    if (!user) return 0;
    return messages.filter(m => !m.read && m.toId === user.id).length;
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">NA</div>
            <div>
              <h1>NeighborAid</h1>
              <p className="tagline">Community Resource Sharing Platform</p>
            </div>
          </div>
          {user && (
            <div className="user-controls">
              <div className="user-info">
                <span className="user-initial">{user.name.charAt(0)}</span>
                <span>{user.name}</span>
              </div>
              <button className="icon-btn" onClick={() => setShowInbox(!showInbox)} title="Messages">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {getUnreadCount() > 0 && <span className="badge">{getUnreadCount()}</span>}
              </button>
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)} title="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
              </button>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem.itemType === 'request' ? 'Request Details' : 'Offer Details'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Posted by:</strong> {selectedItem.name}</p>
              <p><strong>Type:</strong> {selectedItem.resource_type}</p>
              <p><strong>Description:</strong> {selectedItem.description}</p>
              <p><strong>Quantity:</strong> {selectedItem.quantity}</p>
              {selectedItem.urgency && <p><strong>Urgency:</strong> {selectedItem.urgency}</p>}
              {selectedItem.availability && <p><strong>Availability:</strong> {selectedItem.availability}</p>}
              <p><strong>Location:</strong> {selectedItem.address}</p>
              {selectedItem.image && (
                <div className="modal-image">
                  <img src={selectedItem.image} alt="Item" />
                </div>
              )}
              <button className="btn-primary" onClick={() => {
                setShowModal(false);
                openChat({...selectedItem, user_id: selectedItem.user_id || selectedItem.id});
              }}>
                Contact {selectedItem.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inbox Panel */}
      {showInbox && (
        <div className="side-panel inbox-panel">
          <div className="panel-header">
            <h3>Messages</h3>
            <button className="close-btn" onClick={() => setShowInbox(false)}>×</button>
          </div>
          
          {currentChat ? (
            <div className="chat-container">
              <div className="chat-header">
                <button className="back-btn" onClick={() => setCurrentChat(null)}>← Back</button>
                <h4>{currentChat.name}</h4>
              </div>
              
              <div className="chat-messages">
                {getChatMessages(currentChat.user_id).length === 0 ? (
                  <p className="no-messages-chat">No messages yet. Start the conversation!</p>
                ) : (
                  getChatMessages(currentChat.user_id).map(msg => (
                    <div key={msg.id} className={`message ${msg.fromId === user.id ? 'sent' : 'received'}`}>
                      <p>{msg.text}</p>
                      <span className="msg-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="chat-input-container">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(currentChat.name, currentChat.user_id)}
                />
                <button onClick={() => sendMessage(currentChat.name, currentChat.user_id)}>Send</button>
              </div>
              
              <div className="contact-options">
                <h5>Contact Information</h5>
                <p><strong>Phone:</strong> {currentChat.phone}</p>
                <p><strong>Address:</strong> {currentChat.address}</p>
              </div>
            </div>
          ) : (
            <div className="inbox-list">
              <p className="inbox-hint">Start a conversation by clicking "Start Conversation" on a match</p>
            </div>
          )}
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="side-panel notifications-panel">
          <div className="panel-header">
            <h3>Notifications</h3>
            <button className="close-btn" onClick={() => setShowNotifications(false)}>×</button>
          </div>
          <div className="notif-content">
            {notifications.length === 0 ? (
              <p className="no-notifications">No new notifications</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="notification-item">
                  <p>{notif.message}</p>
                  <span className="notif-time">{notif.time}</span>
                </div>
              ))
            )}
            {notifications.length > 0 && (
              <button className="clear-btn" onClick={() => setNotifications([])}>Clear All</button>
            )}
          </div>
        </div>
      )}

      <nav className="nav-bar">
        <button onClick={() => setCurrentView('home')}>Home</button>
        {!user && <button onClick={() => setCurrentView('login')}>Login</button>}
        {!user && <button onClick={() => setCurrentView('register')}>Register</button>}
        {user && <button onClick={() => setCurrentView('dashboard')}>Dashboard</button>}
        {user && <button onClick={() => setCurrentView('request')}>Request Help</button>}
        {user && <button onClick={() => setCurrentView('offer')}>Offer Help</button>}
        {user && <button onClick={loadCommunityData}>Community</button>}
      </nav>

      <main className="main-content">
        
        {/* HOME */}
        {currentView === 'home' && (
          <div className="view-container home-view">
            <div className="home-hero">
              <h2>Connect. Share. Survive.</h2>
              <p className="hero-subtitle">AI-powered platform connecting neighbors during disasters and emergencies</p>
            </div>
            
            <div className="home-features">
              <div className="feature-card">
                <h3>Request Resources</h3>
                <p>Post what you need and get matched with nearby providers</p>
              </div>
              <div className="feature-card">
                <h3>Offer Support</h3>
                <p>Share supplies, shelter, or transportation with those in need</p>
              </div>
              <div className="feature-card">
                <h3>AI Matching</h3>
                <p>Smart algorithms find the best matches based on location and urgency</p>
              </div>
            </div>
            
            {!user && (
              <div className="cta-section">
                <button className="cta-button" onClick={() => setCurrentView('register')}>Get Started</button>
                <button className="cta-button-secondary" onClick={() => setCurrentView('login')}>Sign In</button>
              </div>
            )}
          </div>
        )}

        {/* LOGIN */}
        {currentView === 'login' && (
          <div className="view-container">
            <h2>Sign In</h2>
            <form onSubmit={handleLogin} className="form">
              <input type="email" placeholder="Email Address" value={loginForm.email}
                onChange={(e) => setLoginForm({email: e.target.value})} required />
              <div className="checkbox-group">
                <input type="checkbox" id="remember" checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)} />
                <label htmlFor="remember">Remember me</label>
              </div>
              <button type="submit" className="btn-primary">Sign In</button>
              <p className="form-link">
                Don't have an account? <span onClick={() => setCurrentView('register')} className="link">Register</span>
              </p>
            </form>
          </div>
        )}

        {/* REGISTER */}
        {currentView === 'register' && (
          <div className="view-container">
            <h2>Create Account</h2>
            <form onSubmit={handleRegister} className="form">
              <input type="text" placeholder="Full Name" value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})} required />
              <input type="email" placeholder="Email" value={registerForm.email}
                onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})} required />
              <input type="tel" placeholder="Phone Number" value={registerForm.phone}
                onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})} required />
              <input type="text" placeholder="Street Address, City, State ZIP" value={registerForm.address}
                onChange={(e) => setRegisterForm({...registerForm, address: e.target.value})} required />
              <div className="form-group">
                <label>Search Radius: {registerForm.radius} miles</label>
                <input type="range" min="0.5" max="5" step="0.5" value={registerForm.radius}
                  onChange={(e) => setRegisterForm({...registerForm, radius: parseFloat(e.target.value)})} />
              </div>
              <button type="submit" className="btn-primary">Create Account</button>
              <p className="form-link">
                Already registered? <span onClick={() => setCurrentView('login')} className="link">Sign in</span>
              </p>
            </form>
          </div>
        )}

        {/* DASHBOARD */}
        {currentView === 'dashboard' && user && (
          <div className="view-container">
            <h2>Dashboard</h2>
            
            <div className="radius-adjuster">
              <label>Search Radius: <strong>{user.radius} miles</strong></label>
              <input type="range" min="0.5" max="5" step="0.5" value={user.radius}
                onChange={(e) => updateRadius(parseFloat(e.target.value))} className="radius-slider" />
              <div className="radius-labels">
                <span>0.5 mi</span>
                <span>5 mi</span>
              </div>
            </div>
            
            <div className="dashboard-grid">
              <div className="dash-card" onClick={() => setCurrentView('request')}>
                <h3>Request Help</h3>
                <p>Post what you need</p>
              </div>
              <div className="dash-card" onClick={() => setCurrentView('offer')}>
                <h3>Offer Help</h3>
                <p>Share resources</p>
              </div>
              <div className="dash-card" onClick={loadCommunityData}>
                <h3>Community</h3>
                <p>View all activity</p>
              </div>
            </div>
          </div>
        )}

        {/* REQUEST */}
        {currentView === 'request' && user && (
          <div className="view-container">
            <h2>Request Help</h2>
            <form onSubmit={handleCreateRequest} className="form">
              <select value={requestForm.resource_type}
                onChange={(e) => setRequestForm({...requestForm, resource_type: e.target.value})}>
                <option value="medicine">Medicine</option>
                <option value="food">Food & Water</option>
                <option value="shelter">Shelter</option>
                <option value="power">Power</option>
                <option value="transportation">Transportation</option>
                <option value="supplies">Supplies</option>
                <option value="miscellaneous">Miscellaneous/Other</option>
              </select>
              
              <textarea placeholder="Describe what you need" value={requestForm.description}
                onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                rows="4" required />
              
              <input type="text" placeholder="Quantity needed" value={requestForm.quantity}
                onChange={(e) => setRequestForm({...requestForm, quantity: e.target.value})} required />
              
              <select value={requestForm.urgency}
                onChange={(e) => setRequestForm({...requestForm, urgency: e.target.value})}>
                <option value="critical">Critical (Life-threatening)</option>
                <option value="high">High (Urgent)</option>
                <option value="medium">Medium (Soon)</option>
                <option value="low">Low (When available)</option>
              </select>
              
              <div className="image-upload">
                <label className="upload-label">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'request')} />
                  + Upload Image (Optional)
                </label>
                {requestForm.image && (
                  <img src={requestForm.image} alt="Preview" className="image-preview" />
                )}
              </div>
              
              <button type="submit" className="btn-primary">Find Matches</button>
            </form>
          </div>
        )}

        {/* OFFER */}
        {currentView === 'offer' && user && (
          <div className="view-container">
            <h2>Offer Help</h2>
            <form onSubmit={handleCreateOffer} className="form">
              <select value={offerForm.resource_type}
                onChange={(e) => setOfferForm({...offerForm, resource_type: e.target.value})}>
                <option value="medicine">Medicine</option>
                <option value="food">Food & Water</option>
                <option value="shelter">Shelter</option>
                <option value="power">Power</option>
                <option value="transportation">Transportation</option>
                <option value="supplies">Supplies</option>
                <option value="miscellaneous">Miscellaneous/Other</option>
              </select>
              
              <textarea placeholder="Describe what you're offering" value={offerForm.description}
                onChange={(e) => setOfferForm({...offerForm, description: e.target.value})}
                rows="4" required />
              
              <input type="text" placeholder="Quantity available" value={offerForm.quantity}
                onChange={(e) => setOfferForm({...offerForm, quantity: e.target.value})} required />
              
              <input type="text" placeholder="Availability (e.g., 'Available now', 'Tomorrow evening')" 
                value={offerForm.availability}
                onChange={(e) => setOfferForm({...offerForm, availability: e.target.value})} required />
              
              <div className="image-upload">
                <label className="upload-label">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'offer')} />
                  + Upload Image (Optional)
                </label>
                {offerForm.image && (
                  <img src={offerForm.image} alt="Preview" className="image-preview" />
                )}
              </div>
              
              <button type="submit" className="btn-primary">Post Offer</button>
            </form>
          </div>
        )}

        {/* MATCHES */}
        {currentView === 'matches' && (
          <div className="view-container">
            <h2>Matches Found</h2>
            {matches.length === 0 ? (
              <div className="no-matches">
                <p>No matches within {user?.radius || 1.5} miles</p>
                <button className="btn-secondary" onClick={() => setCurrentView('dashboard')}>
                  Adjust Search Radius
                </button>
              </div>
            ) : (
              <div className="matches-list">
                {matches.map((match, index) => (
                  <div key={index} className="match-card">
                    <div className="match-header">
                      <h3>Match {index + 1}</h3>
                      <span className="match-score">Score: {match.matchScore}/100</span>
                    </div>
                    <div className="match-details">
                      <p><strong>Provider:</strong> {match.name}</p>
                      <p><strong>Distance:</strong> {match.distance} miles</p>
                      <p><strong>Offering:</strong> {match.description}</p>
                      <p><strong>Quantity:</strong> {match.quantity}</p>
                    </div>
                    <div className="match-actions">
                      <button className="btn-accept" onClick={() => handleAcceptOffer(match)}>
                        Start Conversation
                      </button>
                      <p className="action-hint">Opens messaging to coordinate pickup/delivery</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMMUNITY - CLICKABLE ITEMS */}
        {currentView === 'community' && (
          <div className="view-container">
            <h2>Community Board</h2>
            
            <div className="community-section">
              <h3>Active Requests ({allRequests.length})</h3>
              <div className="community-list">
                {allRequests.length === 0 ? (
                  <p className="empty-message">No active requests</p>
                ) : (
                  allRequests.map((req) => (
                    <div key={req.id} className="community-item request-item clickable"
                         onClick={() => viewItemDetails(req, 'request')}>
                      <span className={`urgency-badge ${req.urgency}`}>{req.urgency}</span>
                      <p><strong>{req.name}</strong> needs {req.resource_type}</p>
                      <p>{req.description.substring(0, 80)}...</p>
                      <p className="meta">{req.address} • {new Date(req.created_at).toLocaleString()}</p>
                      <p className="click-hint">Click for details</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="community-section">
              <h3>Active Offers ({allOffers.length})</h3>
              <div className="community-list">
                {allOffers.length === 0 ? (
                  <p className="empty-message">No active offers</p>
                ) : (
                  allOffers.map((offer) => (
                    <div key={offer.id} className="community-item offer-item clickable"
                         onClick={() => viewItemDetails(offer, 'offer')}>
                      <p><strong>{offer.name}</strong> offers {offer.resource_type}</p>
                      <p>{offer.description.substring(0, 80)}...</p>
                      <p><strong>Quantity:</strong> {offer.quantity}</p>
                      <p className="meta">{offer.address} • {new Date(offer.created_at).toLocaleString()}</p>
                      <p className="click-hint">Click for details</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="app-footer">
        <p>NeighborAid © 2026 • Community-Powered Disaster Relief</p>
      </footer>
    </div>
  );
}

export default App;