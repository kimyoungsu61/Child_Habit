package com.genai.database;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;

@WebListener
public class DatabaseHealthListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent event) {
        if (SqlSessionManager.testConnection()) {
            event.getServletContext().log("MyBatis database connection succeeded.");
        } else {
            event.getServletContext().log(
                    "MyBatis database connection failed. Check DB_URL, DB_USERNAME, and DB_PASSWORD.");
        }
    }
}
