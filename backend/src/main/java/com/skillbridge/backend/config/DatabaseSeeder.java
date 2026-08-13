package com.skillbridge.backend.config;

import com.skillbridge.backend.entity.Role;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE student_profiles MODIFY COLUMN profile_photo LONGTEXT");
            jdbcTemplate.execute("ALTER TABLE job_poster_profiles MODIFY COLUMN profile_photo LONGTEXT");
            System.out.println(">>> Database profile_photo columns altered to LONGTEXT successfully!");
        } catch (Exception e) {
            System.err.println(">>> Failed to alter columns to LONGTEXT: " + e.getMessage());
        }

        // Migrate existing admin from skillbridge to skillshare if present
        userRepository.findByEmail("admin@skillbridge.com").ifPresent(admin -> {
            admin.setUsername("admin@skillshare.com");
            admin.setEmail("admin@skillshare.com");
            admin.setFullName("SkillShare Administrator");
            userRepository.save(admin);
            System.out.println(">>> Reverted admin migrated successfully to admin@skillshare.com");
        });

        if (!userRepository.existsByEmail("admin@skillshare.com")) {
            User admin = new User(
                    "admin@skillshare.com",
                    "admin@skillshare.com",
                    passwordEncoder.encode("admin123"),
                    Role.ROLE_ADMIN,
                    "SkillShare Administrator",
                    "+94 11 123 4567"
            );
            userRepository.save(admin);
            System.out.println(">>> Default Administrator account seeded successfully: admin@skillshare.com / admin123");
        }
    }
}
