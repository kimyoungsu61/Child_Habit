package com.genai.database;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;

import com.genai.service.AdminDemoService;

@WebListener
public class DatabaseHealthListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent event) {
        if (SqlSessionManager.testConnection()) {
            event.getServletContext().log("MyBatis database connection succeeded.");
            try {
                new AdminDemoService().prepareAdminDemo();
                event.getServletContext().log("Admin demo account and invite code are ready.");
            } catch (RuntimeException exception) {
                event.getServletContext().log(
                        "Admin demo preparation failed. Server startup continues.",
                        exception);
            }
        } else {
            event.getServletContext().log(
                    "MyBatis database connection failed. Check DB_URL, DB_USERNAME, and DB_PASSWORD.");
        }
    }
}
