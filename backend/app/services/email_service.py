"""
Email Service for sending low stock alerts.
Supports both SMTP (production) and console (development) modes.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict
from app.core.config import settings


class EmailService:
    """Service for sending email notifications."""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.is_configured = bool(self.smtp_user and self.smtp_password)
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: str = None
    ) -> Dict[str, any]:
        """
        Send an email.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            html_body: Optional HTML body
            
        Returns:
            Dictionary with success status and message
        """
        if not self.is_configured:
            # Development mode - just log to console
            print(f"\n{'='*60}")
            print(f"EMAIL (Development Mode)")
            print(f"{'='*60}")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Body:\n{body}")
            print(f"{'='*60}\n")
            return {
                'success': True,
                'message': 'Email logged to console (development mode)',
                'mode': 'console'
            }
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.smtp_user
            msg['To'] = to_email
            
            # Add plain text
            msg.attach(MIMEText(body, 'plain'))
            
            # Add HTML if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Connect and send
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            return {
                'success': True,
                'message': f'Email sent to {to_email}',
                'mode': 'smtp'
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': str(e),
                'mode': 'smtp'
            }
    
    def send_low_stock_alert(
        self,
        to_email: str,
        store_name: str,
        alerts: List[Dict]
    ) -> Dict[str, any]:
        """
        Send low stock alert email for multiple products.
        
        Args:
            to_email: Recipient email
            store_name: Name of the store
            alerts: List of low stock products
            
        Returns:
            Dictionary with success status
        """
        subject = f"⚠️ Low Stock Alert - {store_name}"
        
        # Plain text body
        body = f"""
Low Stock Alert for {store_name}
{'='*50}

The following products need restocking:

"""
        for alert in alerts:
            body += f"""
• {alert['product_name']}
  Current Stock: {alert['current_stock']}
  Reorder Level: {alert['reorder_level']}
  Recommended Order: {alert.get('suggested_quantity', 'N/A')} units

"""
        
        body += """
---
This is an automated alert from Smart Inventory System.
"""
        
        # HTML body
        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #ff6b6b; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">⚠️ Low Stock Alert</h1>
        <p style="margin: 10px 0 0 0;">{store_name}</p>
    </div>
    
    <div style="padding: 20px;">
        <p style="color: #666;">The following products need restocking:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Current Stock</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Reorder Level</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Suggested Order</th>
                </tr>
            </thead>
            <tbody>
"""
        
        for alert in alerts:
            html_body += f"""
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">{alert['product_name']}</td>
                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6; color: #dc3545; font-weight: bold;">{alert['current_stock']}</td>
                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">{alert['reorder_level']}</td>
                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">{alert.get('suggested_quantity', 'N/A')}</td>
                </tr>
"""
        
        html_body += """
            </tbody>
        </table>
        
        <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <p style="margin: 0; color: #666; font-size: 12px;">
                This is an automated alert from <strong>Smart Inventory System</strong>.
            </p>
        </div>
    </div>
</body>
</html>
"""
        
        return self.send_email(to_email, subject, body, html_body)


# Singleton instance
email_service = EmailService()
