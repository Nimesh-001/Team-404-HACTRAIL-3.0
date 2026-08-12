package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.*;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AdminService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private JobPosterProfileRepository jobPosterProfileRepository;

    @Autowired
    private JobPostRepository jobPostRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private MentorProgramRepository mentorProgramRepository;

    @Autowired
    private MentorApplicationRepository mentorApplicationRepository;

    @Autowired
    private AdminMessageRepository adminMessageRepository;

    public AdminStatsResponse getStats() {
        long totalStudents = userRepository.countByRole(Role.ROLE_STUDENT);
        long totalPartners = userRepository.countByRole(Role.ROLE_JOB_POSTER);
        long totalGigs = jobPostRepository.count();

        List<JobPost> approvedGigs = jobPostRepository.findByStatusOrderByCreatedAtDesc("APPROVED");
        long approvedCount = approvedGigs.size();

        double economicImpact = 0.0;
        for (JobPost post : approvedGigs) {
            economicImpact += parseEconomicValue(post.getPriceRange());
        }

        return new AdminStatsResponse(totalStudents, totalPartners, totalGigs, approvedCount, economicImpact);
    }

    public List<AdminUserResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<AdminUserResponse> responses = new ArrayList<>();

        for (User u : users) {
            // Skip admins themselves
            if (u.getRole() == Role.ROLE_ADMIN) {
                continue;
            }

            boolean verified = false;
            String studentId = null;

            if (u.getRole() == Role.ROLE_STUDENT) {
                var profileOpt = studentProfileRepository.findById(u.getId());
                if (profileOpt.isPresent()) {
                    verified = profileOpt.get().isVerified();
                    studentId = profileOpt.get().getStudentId();
                }
            } else if (u.getRole() == Role.ROLE_JOB_POSTER) {
                var profileOpt = jobPosterProfileRepository.findById(u.getId());
                if (profileOpt.isPresent()) {
                    verified = profileOpt.get().isVerified();
                }
            }

            responses.add(new AdminUserResponse(
                    u.getId(),
                    u.getFullName(),
                    u.getEmail(),
                    u.getPhone(),
                    u.getRole().name(),
                    u.isActive(),
                    verified,
                    studentId
            ));
        }

        return responses;
    }

    @Transactional
    public void setUserVerification(Long userId, boolean status) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        if (u.getRole() == Role.ROLE_STUDENT) {
            StudentProfile profile = studentProfileRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Student profile not found for ID: " + userId));
            profile.setVerified(status);
            studentProfileRepository.save(profile);
        } else if (u.getRole() == Role.ROLE_JOB_POSTER) {
            JobPosterProfile profile = jobPosterProfileRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Job poster profile not found for ID: " + userId));
            profile.setVerified(status);
            jobPosterProfileRepository.save(profile);
        }
    }

    @Transactional
    public void setUserStatus(Long userId, boolean active) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        u.setActive(active);
        userRepository.save(u);
    }

    public List<JobPost> getAllJobs() {
        return jobPostRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void moderateJob(Long jobId, String status) {
        JobPost post = jobPostRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job post not found: " + jobId));
        
        if (!status.equals("PENDING") && !status.equals("APPROVED") && !status.equals("REJECTED")) {
            throw new RuntimeException("Invalid status: " + status);
        }
        post.setStatus(status);
        jobPostRepository.save(post);
    }

    @Transactional
    public MentorProgram createMentorProgram(MentorProgram program) {
        return mentorProgramRepository.save(program);
    }

    public List<MentorApplication> getAllMentorApplications() {
        return mentorApplicationRepository.findAllByOrderByAppliedAtDesc();
    }

    @Transactional
    public void moderateMentorApplication(Long appId, String status) {
        MentorApplication app = mentorApplicationRepository.findById(appId)
                .orElseThrow(() -> new RuntimeException("Mentor application not found: " + appId));
        if (!status.equals("APPROVED") && !status.equals("REJECTED")) {
            throw new RuntimeException("Invalid application status: " + status);
        }
        app.setStatus(status);
        mentorApplicationRepository.save(app);
    }

    @Transactional
    public void sendAdminMessage(Long recipientId, String content) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found: " + recipientId));
        
        AdminMessage msg = new AdminMessage(recipient, content);
        adminMessageRepository.save(msg);
    }

    private double parseEconomicValue(String priceRange) {
        if (priceRange == null || priceRange.trim().isEmpty()) return 0.0;
        try {
            // Find all numbers in the string and extract the max one (representing budget upper bound)
            Pattern p = Pattern.compile("\\d+");
            Matcher m = p.matcher(priceRange.replaceAll(",", "")); // strip commas
            double maxVal = 0.0;
            while (m.find()) {
                double val = Double.parseDouble(m.group());
                if (val > maxVal) {
                    maxVal = val;
                }
            }
            return maxVal;
        } catch (Exception e) {
            return 0.0;
        }
    }

    @Transactional
    public JobPost createAdminJobPost(JobPostRequest req, String adminUsername) {
        User adminUser = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("Admin not found: " + adminUsername));

        JobPost jobPost = new JobPost(
                req.getTitle(),
                req.getDescription(),
                req.getRequirements(),
                req.getPriceRange(),
                adminUser
        );
        if (req.getType() != null) {
            jobPost.setType(req.getType());
        }
        if (req.getVacancies() != null) {
            jobPost.setVacancies(req.getVacancies());
        }
        if (req.getMaxApplications() != null) {
            jobPost.setMaxApplications(req.getMaxApplications());
        }
        jobPost.setStatus("APPROVED");

        return jobPostRepository.save(jobPost);
    }

    public List<JobApplication> getSelectedReport() {
        return jobApplicationRepository.findByStatusOrderByAppliedAtDesc("SELECTED");
    }
}
