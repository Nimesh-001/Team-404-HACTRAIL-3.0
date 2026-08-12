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

    @Override
    public void run(String... args) throws Exception {
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
