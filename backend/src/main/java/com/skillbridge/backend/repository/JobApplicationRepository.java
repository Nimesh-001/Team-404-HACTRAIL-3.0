package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    boolean existsByJobPostIdAndStudentId(Long jobPostId, Long studentId);
    long countByJobPostId(Long jobPostId);
    java.util.List<JobApplication> findByJobPostIdOrderByAppliedAtDesc(Long jobPostId);
    java.util.List<JobApplication> findByStatusOrderByAppliedAtDesc(String status);
}
