package com.skillbridge.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "university_bank_details")
public class UniversityBankDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bank_name", nullable = false)
    private String bankName;

    @Column(name = "account_number", nullable = false)
    private String accountNumber;

    @Column(name = "branch_name", nullable = false)
    private String branchName;

    @Column(name = "account_holder_name", nullable = false)
    private String accountHolderName;

    public UniversityBankDetails() {
    }

    public UniversityBankDetails(String bankName, String accountNumber, String branchName, String accountHolderName) {
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.branchName = branchName;
        this.accountHolderName = accountHolderName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public void setAccountHolderName(String accountHolderName) {
        this.accountHolderName = accountHolderName;
    }
}
