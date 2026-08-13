package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.*;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class ProfileService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private JobPosterProfileRepository jobPosterProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public ProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        ProfileResponse res = new ProfileResponse();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setEmail(user.getEmail());
        res.setRole(user.getRole().name());
        res.setFullName(user.getFullName());
        res.setPhone(user.getPhone());

        if (user.getRole() == Role.ROLE_STUDENT) {
            studentProfileRepository.findById(user.getId()).ifPresent(profile -> {
                res.setStudentId(profile.getStudentId());
                res.setDepartment(profile.getDepartment());
                res.setYearOfStudy(profile.getYearOfStudy());
                res.setSkills(profile.getSkills());
                res.setBio(profile.getBio());
                res.setProfilePhoto(profile.getProfilePhoto());
                res.setGithubLink(profile.getGithubLink());
                res.setLinkedinLink(profile.getLinkedinLink());
            });
        } else if (user.getRole() == Role.ROLE_JOB_POSTER) {
            jobPosterProfileRepository.findById(user.getId()).ifPresent(profile -> {
                res.setCompanyName(profile.getCompanyName());
                res.setIndustry(profile.getIndustry());
                res.setWebsite(profile.getWebsite());
                res.setBio(profile.getBio());
                res.setProfilePhoto(profile.getProfilePhoto());
                res.setCurrentPosition(profile.getCurrentPosition());
            });
        }

        return res;
    }

    @Transactional
    public void updateStudentProfile(String username, StudentProfileUpdateRequest req) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        StudentProfile profile = studentProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Student profile not found for user: " + user.getId()));

        // Validate links if not empty
        if (req.getGithubLink() != null && !req.getGithubLink().trim().isEmpty()) {
            String link = req.getGithubLink().trim();
            if (!link.startsWith("http://") && !link.startsWith("https://")) {
                throw new RuntimeException("GitHub link must start with http:// or https://");
            }
            if (!link.contains("github.com")) {
                throw new RuntimeException("GitHub link must be a valid github.com URL");
            }
            profile.setGithubLink(link);
        } else {
            profile.setGithubLink(null);
        }

        if (req.getLinkedinLink() != null && !req.getLinkedinLink().trim().isEmpty()) {
            String link = req.getLinkedinLink().trim();
            if (!link.startsWith("http://") && !link.startsWith("https://")) {
                throw new RuntimeException("LinkedIn link must start with http:// or https://");
            }
            if (!link.contains("linkedin.com")) {
                throw new RuntimeException("LinkedIn link must be a valid linkedin.com URL");
            }
            profile.setLinkedinLink(link);
        } else {
            profile.setLinkedinLink(null);
        }

        profile.setBio(req.getBio());
        profile.setProfilePhoto(req.getProfilePhoto());
        profile.setSkills(req.getSkills());

        studentProfileRepository.save(profile);

        // Update password if provided
        if (req.getPassword() != null && !req.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(req.getPassword().trim()));
            userRepository.save(user);
        }
    }

    @Transactional
    public void updateJobPosterProfile(String username, JobPosterProfileUpdateRequest req) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        JobPosterProfile profile = jobPosterProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Job poster profile not found for user: " + user.getId()));

        profile.setBio(req.getBio());
        profile.setProfilePhoto(req.getProfilePhoto());
        profile.setCurrentPosition(req.getCurrentPosition());

        jobPosterProfileRepository.save(profile);
    }
}
