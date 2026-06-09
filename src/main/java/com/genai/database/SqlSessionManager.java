package com.genai.database;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;

public final class SqlSessionManager {
    private static final SqlSessionFactory SQL_SESSION_FACTORY = buildFactory();

    private SqlSessionManager() {
    }

    public static SqlSessionFactory getFactory() {
        return SQL_SESSION_FACTORY;
    }

    public static boolean testConnection() {
        try (SqlSession session = SQL_SESSION_FACTORY.openSession()) {
            return session.getConnection().isValid(3);
        } catch (Exception exception) {
            return false;
        }
    }

    private static SqlSessionFactory buildFactory() {
        try (InputStream config = Resources.getResourceAsStream("mybatis-config.xml")) {
            Properties properties = loadDatabaseProperties();
            applyOverride(properties, "db.url", "DB_URL");
            applyOverride(properties, "db.username", "DB_USERNAME");
            applyOverride(properties, "db.password", "DB_PASSWORD");
            return new SqlSessionFactoryBuilder().build(config, "development", properties);
        } catch (IOException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    private static Properties loadDatabaseProperties() throws IOException {
        Properties properties = new Properties();
        try (InputStream input = Resources.getResourceAsStream("db.properties")) {
            properties.load(input);
        }
        return properties;
    }

    private static void applyOverride(Properties properties, String propertyName, String environmentName) {
        String value = System.getProperty(propertyName);
        if (value == null || value.isBlank()) {
            value = System.getenv(environmentName);
        }
        if (value != null && !value.isBlank()) {
            properties.setProperty(propertyName, value);
        }
    }
}
