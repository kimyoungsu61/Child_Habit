package com.genai.database;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

class MyBatisConfigurationTest {
    @Test
    void buildsSqlSessionFactory() {
        assertNotNull(SqlSessionManager.getFactory());
    }
}
