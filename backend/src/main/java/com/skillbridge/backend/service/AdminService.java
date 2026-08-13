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

    @Autowired
    private UniversityBankDetailsRepository universityBankDetailsRepository;

    public AdminStatsResponse getStats() {
        long totalStudents = userRepository.countByRole(Role.ROLE_STUDENT);
        long totalPartners = userRepository.countByRole(Role.ROLE_JOB_POSTER);
        long totalGigs = jobPostRepository.count();

        // Count approved gigs (just APPROVED status for display)
        List<JobPost> approvedGigs = jobPostRepository.findByStatusOrderByCreatedAtDesc("APPROVED");
        long approvedCount = approvedGigs.size();

        // Economic impact = sum of total budgets across ALL active gigs (APPROVED + COMPLETED + CLOSED)
        // Each per-member priceRange is multiplied back by vacancies to recover the original total budget
        double economicImpact = 0.0;
        List<String> activeStatuses = java.util.Arrays.asList("APPROVED", "COMPLETED", "CLOSED");
        List<JobPost> allActivePosts = jobPostRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(p -> activeStatuses.contains(p.getStatus()) && "JOB".equals(p.getType()))
                .collect(java.util.stream.Collectors.toList());
        for (JobPost post : allActivePosts) {
            double perMember = parseEconomicValue(post.getPriceRange());
            int vacancies = post.getVacancies() != null ? post.getVacancies() : 1;
            economicImpact += perMember * vacancies;
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
                    studentId,
                    u.isDeleted()
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

    @Transactional
    public void deleteUser(Long userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        u.setDeleted(true);
        u.setActive(false);
        userRepository.save(u);
    }

    @Transactional
    public void restoreUser(Long userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        u.setDeleted(false);
        u.setActive(true);
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
            // Strip commas, then extract the FIRST number only
            // Handles "LKR 10,000 (per member)", "LKR 15,000 - 25,000", etc.
            String stripped = priceRange.replaceAll(",", "");
            Pattern p = Pattern.compile("\\d+");
            Matcher m = p.matcher(stripped);
            if (m.find()) {
                return Double.parseDouble(m.group());
            }
            return 0.0;
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
        if (req.getBankSlip() != null) {
            jobPost.setBankSlip(req.getBankSlip());
        }
        if (req.getWebsiteLink() != null) {
            jobPost.setWebsiteLink(req.getWebsiteLink());
        }
        jobPost.setStatus("APPROVED");

        return jobPostRepository.save(jobPost);
    }

    public List<JobApplication> getSelectedReport() {
        return jobApplicationRepository.findByStatusOrderByAppliedAtDesc("SELECTED");
    }

    public UniversityBankDetails getBankDetails() {
        return universityBankDetailsRepository.findAll().stream().findFirst().orElseGet(() -> {
            UniversityBankDetails details = new UniversityBankDetails(
                "Bank of Ceylon",
                "871329581",
                "University Branch - Galle",
                "SkillBridge University Development Fund"
            );
            return universityBankDetailsRepository.save(details);
        });
    }

    @Transactional
    public UniversityBankDetails updateBankDetails(UniversityBankDetails req) {
        UniversityBankDetails details = getBankDetails();
        details.setBankName(req.getBankName());
        details.setAccountNumber(req.getAccountNumber());
        details.setBranchName(req.getBranchName());
        details.setAccountHolderName(req.getAccountHolderName());
        return universityBankDetailsRepository.save(details);
    }

    @Transactional
    public void notifyPaymentCollection(Long jobId, com.skillbridge.backend.dto.PaymentNotifyRequest req) {
        JobPost jobPost = jobPostRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!"COMPLETED".equals(jobPost.getStatus())) {
            throw new RuntimeException("Validation Error: This opportunity has not been completed by the industry partner yet.");
        }

        List<JobApplication> selections = jobApplicationRepository.findByJobPostIdOrderByAppliedAtDesc(jobId);
        for (JobApplication app : selections) {
            if ("SELECTED".equals(app.getStatus())) {
                User student = app.getStudent();
                String notification = "Attention: You are requested to collect your cash payment of " + 
                        jobPost.getPriceRange() + " for the completed project: \"" + jobPost.getTitle() + 
                        "\". Venue: " + req.getVenue() + " | Time: " + req.getTime() + ". Please present your university student ID card.";
                AdminMessage msg = new AdminMessage(student, notification);
                adminMessageRepository.save(msg);
            }
        }
    }

    @Transactional
    public void closeJob(Long jobId, com.skillbridge.backend.dto.CloseJobRequest req) {
        JobPost jobPost = jobPostRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!"COMPLETED".equals(jobPost.getStatus())) {
            throw new RuntimeException("Validation Error: Payment notifications can only be finalized for completed projects.");
        }

        jobPost.setStatus("CLOSED");
        jobPost.setSignedReportSlip(req.getSignedReportSlip());
        jobPostRepository.save(jobPost);
    }
}
