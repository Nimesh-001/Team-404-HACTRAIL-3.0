package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.JobPostRequest;
import com.skillbridge.backend.entity.JobPost;
import com.skillbridge.backend.entity.User;
import com.skillbridge.backend.repository.JobPostRepository;
import com.skillbridge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class JobPostService {
    @Autowired
    private JobPostRepository jobPostRepository;

    @Autowired
    private UserRepository userRepository;

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

        return jobPostRepository.save(jobPost);
    }

    public List<JobPost> getAllJobPosts() {
        return jobPostRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<JobPost> getMyJobPosts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return jobPostRepository.findByPostedByIdOrderByCreatedAtDesc(user.getId());
    }
}
