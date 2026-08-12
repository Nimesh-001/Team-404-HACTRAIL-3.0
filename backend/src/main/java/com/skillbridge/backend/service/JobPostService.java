package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.JobPostRequest;
import com.skillbridge.backend.entity.JobPost;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.repository.JobPostRepository;
import com.skillbridge.backend.repository.UserRepository;
import com.skillbridge.backend.repository.JobApplicationRepository;
import com.skillbridge.backend.repository.AdminMessageRepository;
import com.skillbridge.backend.entity.JobApplication;
import com.skillbridge.backend.entity.AdminMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class JobPostService {
    @Autowired
    private JobPostRepository jobPostRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private AdminMessageRepository adminMessageRepository;

    public JobPost createJobPost(JobPostRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        JobPost jobPost = new JobPost(
                req.getTitle(),
                req.getDescription(),
                req.getRequirements(),
                req.getPriceRange(),
                user
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

        return jobPostRepository.save(jobPost);
    }

    public List<JobPost> getAllJobPosts(String type) {
        if (type != null && !type.trim().isEmpty()) {
            return jobPostRepository.findByTypeAndStatusOrderByCreatedAtDesc(type, "APPROVED");
        }
        return jobPostRepository.findByStatusOrderByCreatedAtDesc("APPROVED");
    }

    public List<JobPost> getMyJobPosts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return jobPostRepository.findByPostedByIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public JobApplication applyToJob(Long jobId, String username, String linkedinUrl, String coverLetter) {
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Student not found: " + username));

        JobPost jobPost = jobPostRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Opportunity not found: " + jobId));

        if (!"APPROVED".equals(jobPost.getStatus())) {
            throw new RuntimeException("Opportunity has not been approved by administrator.");
        }

        if (jobApplicationRepository.existsByJobPostIdAndStudentId(jobId, student.getId())) {
            throw new RuntimeException("You have already applied for this opportunity.");
        }

        long currentApplications = jobApplicationRepository.countByJobPostId(jobId);
        if (currentApplications >= jobPost.getMaxApplications()) {
            throw new RuntimeException("This opportunity has reached its maximum application limit.");
        }

        JobApplication app = new JobApplication(jobPost, student, linkedinUrl, coverLetter);
        jobApplicationRepository.save(app);

        // Update applicationCount field
        jobPost.setApplicationCount((int) (currentApplications + 1));
        jobPostRepository.save(jobPost);

        return app;
    }

    public List<JobApplication> getApplicationsForJob(Long jobId, String username) {
        User partner = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Partner not found: " + username));
        
        JobPost post = jobPostRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Opportunity not found: " + jobId));

        if (!post.getPostedBy().getId().equals(partner.getId())) {
            throw new RuntimeException("Unauthorized action: You cannot view applications for this opportunity.");
        }

        return jobApplicationRepository.findByJobPostIdOrderByAppliedAtDesc(jobId);
    }

    @Transactional
    public void selectApplicant(Long applicationId, String username) {
        User partner = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Partner not found: " + username));

        JobApplication app = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        if (!app.getJobPost().getPostedBy().getId().equals(partner.getId())) {
            throw new RuntimeException("Unauthorized action: You cannot select applicants for this opportunity.");
        }

        app.setStatus("SELECTED");
        jobApplicationRepository.save(app);

        User student = app.getStudent();
        String notificationText = "Congratulations! You have been selected by " + partner.getFullName() + 
                " for the opportunity: \"" + app.getJobPost().getTitle() + "\". Please check your contact channels for next steps.";
        
        AdminMessage msg = new AdminMessage(student, notificationText);
        adminMessageRepository.save(msg);
    }
}
