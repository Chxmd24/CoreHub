package com.corehub.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SuperAdminProvisioningRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminProvisioningRunner.class);

    private final SuperAdminProvisioningService provisioningService;

    @Value("${corehub.provision.superadmin.identifier:}")
    private String configuredIdentifier;

    public SuperAdminProvisioningRunner(SuperAdminProvisioningService provisioningService) {
        this.provisioningService = provisioningService;
    }

    @Override
    public void run(String... args) {
        String identifier = configuredIdentifier;

        if (identifier == null || identifier.trim().isEmpty()) {
            identifier = System.getProperty("corehub.provision.superadmin.identifier");
        }
        if (identifier == null || identifier.trim().isEmpty()) {
            identifier = System.getenv("COREHUB_PROVISION_SUPERADMIN_IDENTIFIER");
        }
        if (identifier == null || identifier.trim().isEmpty()) {
            for (String arg : args) {
                if (arg != null && arg.startsWith("--corehub.provision.superadmin.identifier=")) {
                    identifier = arg.substring("--corehub.provision.superadmin.identifier=".length());
                    break;
                }
            }
        }

        if (identifier != null && !identifier.trim().isEmpty()) {
            log.info("Detected local SUPER_ADMIN provisioning directive. Executing provisioning...");
            try {
                provisioningService.provisionSuperAdmin(identifier.trim());
                log.info("Local SUPER_ADMIN provisioning completed successfully.");
            } catch (Exception e) {
                log.error("Local SUPER_ADMIN provisioning failed: {}", e.getMessage());
            }
        }

        // Email correction directive for project owner SUPER_ADMIN
        String oldEmail = System.getProperty("corehub.repair.superadmin.old");
        if (oldEmail == null || oldEmail.trim().isEmpty()) {
            oldEmail = System.getenv("COREHUB_REPAIR_SUPERADMIN_OLD");
        }
        String newEmail = System.getProperty("corehub.repair.superadmin.new");
        if (newEmail == null || newEmail.trim().isEmpty()) {
            newEmail = System.getenv("COREHUB_REPAIR_SUPERADMIN_NEW");
        }
        if (oldEmail == null || oldEmail.trim().isEmpty() || newEmail == null || newEmail.trim().isEmpty()) {
            for (String arg : args) {
                if (arg != null && arg.startsWith("--corehub.repair.superadmin.old=")) {
                    oldEmail = arg.substring("--corehub.repair.superadmin.old=".length());
                } else if (arg != null && arg.startsWith("--corehub.repair.superadmin.new=")) {
                    newEmail = arg.substring("--corehub.repair.superadmin.new=".length());
                }
            }
        }

        if (oldEmail != null && !oldEmail.trim().isEmpty() && newEmail != null && !newEmail.trim().isEmpty()) {
            log.info("Detected local SUPER_ADMIN email correction directive. Executing repair...");
            try {
                provisioningService.correctSuperAdminEmail(oldEmail.trim(), newEmail.trim());
                log.info("Local SUPER_ADMIN email correction completed successfully.");
            } catch (Exception e) {
                log.error("Local SUPER_ADMIN email correction failed: {}", e.getMessage());
            }
        }
    }
}
