package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.JobPosterProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobPosterProfileRepository extends JpaRepository<JobPosterProfile, Long> {
}
