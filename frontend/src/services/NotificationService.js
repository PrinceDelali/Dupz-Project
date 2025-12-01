/**
 * Notification Service for handling sound alerts and browser notifications
 */

class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.isMuted = localStorage.getItem('notification_muted') === 'true';
    this.lastPlayed = 0;
    this.cooldownPeriod = 3000; // Minimum time between sounds in ms
    this.audioElements = {};
    this.isInitialized = false;
    
    // Initialize notification permissions
    this.initialize();
    
    console.log('[NotificationService] Service instance created');
  }
  
  // Initialize notification permissions
  async initialize() {
    console.log('[NotificationService] Initializing...');
    
    // Only initialize once
    if (this.isInitialized) {
      console.log('[NotificationService] Already initialized');
      return;
    }
    
    // Create audio elements for various notification sounds
    this.createAudioElements();
    
    // Check if browser supports notifications
    if ('Notification' in window) {
      console.log('[NotificationService] Browser supports notifications');
      
      if (Notification.permission === 'granted') {
        console.log('[NotificationService] Notification permission already granted');
        this.hasPermission = true;
      } else if (Notification.permission !== 'denied') {
        try {
          console.log('[NotificationService] Requesting notification permission');
          const permission = await Notification.requestPermission();
          this.hasPermission = permission === 'granted';
          console.log(`[NotificationService] Permission ${this.hasPermission ? 'granted' : 'denied'}`);
        } catch (err) {
          console.error('[NotificationService] Error requesting notification permission:', err);
        }
      } else {
        console.log('[NotificationService] Notification permission previously denied');
      }
    } else {
      console.warn('[NotificationService] Browser does not support notifications');
    }
    
    // Set up custom event listeners for order updates
    window.addEventListener('order-status-updated', (event) => {
      console.log('[NotificationService] Received order-status-updated event:', event.detail);
      
      if (event.detail && event.detail.order) {
        const { order } = event.detail;
        this.playOrderStatusSound(order.status);
        
        if (this.hasPermission && !document.hasFocus()) {
          this.showOrderStatusNotification(order);
        }
      }
    });
    
    this.isInitialized = true;
    console.log('[NotificationService] Initialization complete');
    
    // Make the service globally available
    window.notificationService = this;
  }
  
  createAudioElements() {
    console.log('[NotificationService] Creating audio elements');
    
    // Create an audio element for message notification
    this.audioElements.message = new Audio();
    this.audioElements.message.src = '/assets/sounds/message.mp3';
    this.audioElements.message.preload = 'auto';
    this.audioElements.message.volume = 0.5;
    
    // Create an audio element for order status notification
    this.audioElements.orderStatus = new Audio();
    this.audioElements.orderStatus.src = '/assets/sounds/notification.mp3';
    this.audioElements.orderStatus.preload = 'auto';
    this.audioElements.orderStatus.volume = 0.5;
    
    // Create a fallback sound if the file doesn't exist
    const handleAudioError = (audioName) => {
      console.warn(`[NotificationService] Could not load ${audioName} sound, creating fallback`);
      
      // Create a fallback audio using AudioContext API
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        this.audioElements[audioName] = {
          play: () => {
            oscillator.start();
            setTimeout(() => oscillator.stop(), 200);
          }
        };
      } catch (err) {
        console.error('[NotificationService] Error creating fallback audio:', err);
      }
    };
    
    this.audioElements.message.onerror = () => handleAudioError('message');
    this.audioElements.orderStatus.onerror = () => handleAudioError('orderStatus');
  }
  
  // Toggle mute state
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('notification_muted', this.isMuted);
    console.log(`[NotificationService] Notifications ${this.isMuted ? 'muted' : 'unmuted'}`);
    return this.isMuted;
  }
  
  // Play a sound for a new message
  playMessageSound() {
    if (this.isMuted) {
      console.log('[NotificationService] Skipping sound (muted)');
      return;
    }
    
    const now = Date.now();
    // Only play if cooldown period has passed
    if (now - this.lastPlayed > this.cooldownPeriod) {
      try {
        console.log('[NotificationService] Playing message notification sound');
        // Create a new Audio instance each time to avoid the "start more than once" error
        const audioElement = new Audio(this.audioElements.message.src);
        audioElement.volume = 0.5;
        audioElement.play().catch(err => {
          console.warn('[NotificationService] Error playing notification sound:', err);
        });
        this.lastPlayed = now;
      } catch (err) {
        console.error('[NotificationService] Error playing notification sound:', err);
      }
    } else {
      console.log('[NotificationService] Skipping sound (cooldown period)');
    }
  }
  
  // Play sound based on order status
  playOrderStatusSound(status) {
    if (this.isMuted) {
      console.log('[NotificationService] Skipping order status sound (muted)');
      return;
    }
    
    const now = Date.now();
    if (now - this.lastPlayed > this.cooldownPeriod) {
      try {
        console.log(`[NotificationService] Playing order status sound for: ${status}`);
        // Create a new Audio instance each time to avoid the "start more than once" error
        const audioElement = new Audio(this.audioElements.orderStatus.src);
        audioElement.volume = 0.5;
        audioElement.play().catch(err => {
          console.warn('[NotificationService] Error playing order status sound:', err);
        });
        this.lastPlayed = now;
      } catch (err) {
        console.error('[NotificationService] Error playing order status sound:', err);
      }
    } else {
      console.log('[NotificationService] Skipping order status sound (cooldown period)');
    }
  }
  
  // Show a browser notification for a new message
  showMessageNotification(title, options = {}) {
    if (!this.hasPermission || document.hasFocus()) {
      console.log('[NotificationService] Not showing notification - permission denied or window focused');
      return;
    }
    
    try {
      console.log(`[NotificationService] Showing message notification: ${title}`);
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      });
      
      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      // Focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.error('[NotificationService] Error showing notification:', err);
    }
  }
  
  // Show a browser notification for an order status update
  showOrderStatusNotification(order) {
    if (!this.hasPermission || document.hasFocus()) {
      console.log('[NotificationService] Not showing order notification - permission denied or window focused');
      return;
    }
    
    try {
      const title = `Order ${order.status}`;
      let message = `Order #${order.orderNumber} `;
      
      switch (order.status.toLowerCase()) {
        case 'delivered':
          message += 'has been delivered!';
          break;
        case 'processing':
          message += 'is now being processed.';
          break;
        case 'shipped':
          message += 'has been shipped and is on its way.';
          break;
        case 'cancelled':
          message += 'has been cancelled.';
          break;
        default:
          message += `status updated to ${order.status}.`;
      }
      
      console.log(`[NotificationService] Showing order notification: ${title} - ${message}`);
      
      const notification = new Notification(title, {
        body: message,
        icon: '/logo.png',
        badge: '/logo.png'
      });
      
      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      // Focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
        // Navigate to order details if available
        if (order._id) {
          window.location.href = `/profile?tab=orders&order=${order._id}`;
        }
      };
    } catch (err) {
      console.error('[NotificationService] Error showing order notification:', err);
    }
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

// Add method to manually trigger order update notification (for testing)
notificationService.triggerOrderStatusUpdate = (order) => {
  console.log('[NotificationService] Manually triggering order status update:', order);
  window.dispatchEvent(new CustomEvent('order-status-updated', { detail: { order } }));
};

export default notificationService; 