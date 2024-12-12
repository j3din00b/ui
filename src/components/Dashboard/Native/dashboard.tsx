// src/components/Dashboard/Native/dashboard.tsx
import * as React from 'react';
import { Card, CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { PageBreadcrumb } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core/dist/esm/components/Breadcrumb';
import { Spinner } from '@patternfly/react-core/dist/esm/components/Spinner';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/esm/deprecated/components/Modal';
import { EmptyState, EmptyStateBody, EmptyStateFooter, EmptyStateActions } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import GithubIcon from '@patternfly/react-icons/dist/esm/icons/github-icon';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@patternfly/react-icons/dist/esm/icons/trash-icon';
import { Tooltip } from '@patternfly/react-core/dist/esm/components/Tooltip/Tooltip';
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons/catalog-icon';
import { AlertGroup } from '@patternfly/react-core/dist/esm/components/Alert/AlertGroup';
import { Alert, AlertProps, AlertVariant } from '@patternfly/react-core/dist/esm/components/Alert/Alert';
import { AlertActionCloseButton } from '@patternfly/react-core/dist/esm/components/Alert/AlertActionCloseButton';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { UploadIcon } from '@patternfly/react-icons/dist/esm/icons/upload-icon';
import { ModalHeader } from '@patternfly/react-core/dist/esm/components/Modal/ModalHeader';
import { ModalBody } from '@patternfly/react-core/dist/esm/components/Modal/ModalBody';
import { FormGroup } from '@patternfly/react-core/dist/esm/components/Form/FormGroup';
import { Form } from '@patternfly/react-core/dist/esm/components/Form/Form';
import { TextInput } from '@patternfly/react-core/dist/esm/components/TextInput/TextInput';
import { ModalFooter } from '@patternfly/react-core/dist/esm/components/Modal/ModalFooter';

const InstructLabLogo: React.FC = () => <Image src="/InstructLab-LogoFile-RGB-FullColor.svg" alt="InstructLab Logo" width={256} height={256} />;

const DashboardNative: React.FunctionComponent = () => {
  const [branches, setBranches] = React.useState<{ name: string; creationDate: number }[]>([]);
  const [selectedTaxonomyRepoDir, setSelectedTaxonomyRepoDir] = React.useState<string>('');
  const [defaultTaxonomyRepoDir, setDefaultTaxonomyRepoDir] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [mergeStatus] = React.useState<{ branch: string; message: string; success: boolean } | null>(null);
  const [diffData, setDiffData] = React.useState<{ branch: string; changes: { file: string; status: string }[] } | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [alerts, setAlerts] = React.useState<Partial<AlertProps>[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(null);

  const getUniqueId = () => new Date().getTime();

  const router = useRouter();

  // Fetch branches from the API route
  React.useEffect(() => {
    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      setDefaultTaxonomyRepoDir(envConfig.TAXONOMY_REPO_DIR);
      setSelectedTaxonomyRepoDir(envConfig.TAXONOMY_REPO_DIR);
    };
    getEnvVariables();

    cloneNativeTaxonomyRepo().then((success) => {
      if (success) {
        fetchBranches();
      }
    });
  }, []);

  const addAlert = (title: string, variant: AlertProps['variant'], key: React.Key) => {
    setAlerts((prevAlerts) => [...prevAlerts, { title, variant, key }]);
  };

  const removeAlert = (key: React.Key) => {
    setAlerts((prevAlerts) => [...prevAlerts.filter((alert) => alert.key !== key)]);
  };

  const addSuccessAlert = (message: string) => {
    addAlert(message, 'success', getUniqueId());
  };

  const addDangerAlert = (message: string) => {
    addAlert(message, 'danger', getUniqueId());
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/native/git/branches');
      const result = await response.json();
      if (response.ok) {
        // Filter out 'main' branch
        const filteredBranches = result.branches.filter((branch: { name: string }) => branch.name !== 'main');
        setBranches(filteredBranches);
      } else {
        console.error('Failed to fetch branches:', result.error);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  async function cloneNativeTaxonomyRepo(): Promise<boolean> {
    try {
      const response = await fetch('/api/native/clone-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (response.ok) {
        console.log(result.message);
        return true;
      } else {
        console.error(result.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error cloning repo:', errorMessage);
      return false;
    }
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Disabling Merge for now, leaving the code for when we re-implement the feature.
  // const handleMerge = async (branchName: string) => {
  //   setMergeStatus(null); // Clear previous status
  //   try {
  //     const response = await fetch('/api/native/git/branches', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ branchName, action: 'merge' })
  //     });
  //
  //     const result = await response.json();
  //     if (response.ok) {
  //       setMergeStatus({ branch: branchName, message: result.message, success: true });
  //     } else {
  //       setMergeStatus({ branch: branchName, message: result.error, success: false });
  //     }
  //   } catch (error) {
  //     setMergeStatus({ branch: branchName, message: 'Merge failed due to an unexpected error.', success: false });
  //     console.error('Error merging branch:', error);
  //   }
  // };

  const handleShowChanges = async (branchName: string) => {
    try {
      const response = await fetch('/api/native/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'diff' })
      });

      const result = await response.json();
      if (response.ok) {
        setDiffData({ branch: branchName, changes: result.changes });
        setIsModalOpen(true);
      } else {
        console.error('Failed to get branch changes:', result.error);
      }
    } catch (error) {
      console.error('Error fetching branch changes:', error);
    }
  };

  const handleDeleteContribution = async (branchName: string) => {
    setSelectedBranch(branchName);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteContributionConfirm = async () => {
    if (selectedBranch) {
      await deleteContribution(selectedBranch);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteContributionCancel = () => {
    setSelectedBranch(null);
    setIsDeleteModalOpen(false);
  };

  const deleteContribution = async (branchName: string) => {
    try {
      const response = await fetch('/api/native/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'delete' })
      });

      const result = await response.json();
      if (response.ok) {
        // Remove the branch from the list
        setBranches((prevBranches) => prevBranches.filter((branch) => branch.name !== branchName));
        addSuccessAlert(result.message);
      } else {
        console.error(result.error);
        addDangerAlert(result.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = 'Error deleting branch ' + branchName + ':' + error.message;
        console.error(errorMessage);
        addDangerAlert(errorMessage);
      } else {
        console.error('Unknown error deleting the contribution ${branchName}');
        addDangerAlert('Unknown error deleting the contribution ${branchName}');
      }
    }
  };
  const handleEditContribution = async (branchName: string) => {
    setSelectedBranch(branchName);
    setIsDeleteModalOpen(true);
  };

  const handlePublishContribution = async (branchName: string) => {
    setSelectedBranch(branchName);
    setIsPublishModalOpen(true);
  };

  const handlePublishContributionConfirm = async () => {
    if (selectedBranch) {
      try {
        const response = await fetch('/api/native/git/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branchName: selectedBranch, action: 'publish', remoteTaxonomyRepoDir: selectedTaxonomyRepoDir })
        });

        const result = await response.json();
        if (response.ok) {
          addSuccessAlert(result.message);
          setSelectedTaxonomyRepoDir(defaultTaxonomyRepoDir);
          setSelectedBranch(null);
          setIsPublishModalOpen(false);
        } else {
          console.error('Failed to publish the contribution:', result.error);
        }
      } catch (error) {
        console.error('Error while publishing the contribution:', error);
      }
    } else {
      addDangerAlert('No branch selected to publish');
    }
  };

  const handlePublishContributionCancel = () => {
    setSelectedTaxonomyRepoDir(defaultTaxonomyRepoDir);
    setSelectedBranch(null);
    setIsPublishModalOpen(false);
  };

  return (
    <div>
      <PageBreadcrumb hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection hasBodyWrapper={false} style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="lg">
          Local Git Repository Branches
        </Title>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <AlertGroup isToast isLiveRegion>
          {alerts.map(({ key, variant, title }) => (
            <Alert
              variant={AlertVariant[variant!]}
              title={title}
              timeout={true}
              actionClose={<AlertActionCloseButton title={title as string} variantLabel={`${variant} alert`} onClose={() => removeAlert(key!)} />}
              key={key}
            />
          ))}
        </AlertGroup>
        {isLoading ? (
          <Spinner size="lg" />
        ) : branches.length === 0 ? (
          <EmptyState headingLevel="h4" titleText="Welcome to InstructLab" icon={InstructLabLogo}>
            <EmptyStateBody>
              <div style={{ maxWidth: '60ch' }}>
                InstructLab is a powerful and accessible tool for advancing generative AI through community collaboration and open-source principles.
                By contributing your own data, you can help train and refine the language model. <br />
                <br />
                To get started, contribute a skill or contribute knowledge.
              </div>
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={() => router.push('/contribute/skill/')}>
                  Contribute Skill
                </Button>
                <Button variant="primary" onClick={() => router.push('/contribute/knowledge/')}>
                  Contribute Knowledge
                </Button>
                <Button variant="primary" onClick={() => router.push('/playground/chat')}>
                  Chat with the Models
                </Button>
              </EmptyStateActions>
              <EmptyStateActions>
                <Button
                  variant="link"
                  icon={<GithubIcon />}
                  iconPosition="right"
                  component="a"
                  href="https://github.com/instructlab"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View the Project on Github
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        ) : (
          <Stack hasGutter>
            {branches.map((branch) => (
              <StackItem key={branch.name}>
                <Card>
                  <CardBody>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                      <FlexItem>
                        Branch Name: {branch.name}
                        <br />
                        Created on: {formatDateTime(branch.creationDate)}
                      </FlexItem>
                      <FlexItem align={{ default: 'alignRight' }}>
                        <Tooltip aria="none" aria-live="polite" content={<div>Show Changes</div>}>
                          <Button icon={<CatalogIcon />} variant="plain" aria-label="show" onClick={() => handleShowChanges(branch.name)} />
                        </Tooltip>
                        <Tooltip aria="none" aria-live="polite" content={<div>Edit Contribution</div>}>
                          <Button icon={<PencilAltIcon />} variant="plain" aria-label="edit" onClick={() => handleEditContribution(branch.name)} />
                        </Tooltip>
                        <Tooltip aria="none" aria-live="polite" content={<div>Publish Changes</div>}>
                          <Button icon={<UploadIcon />} variant="plain" aria-label="publish" onClick={() => handlePublishContribution(branch.name)} />
                        </Tooltip>
                        <Tooltip aria="none" aria-live="polite" content={<div>Delete</div>}>
                          <Button icon={<TrashIcon />} variant="plain" aria-label="delete" onClick={() => handleDeleteContribution(branch.name)} />
                        </Tooltip>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </StackItem>
            ))}
          </Stack>
        )}

        {mergeStatus && (
          <PageSection hasBodyWrapper={false}>
            <p style={{ color: mergeStatus.success ? 'green' : 'red' }}>{mergeStatus.message}</p>
          </PageSection>
        )}

        <Modal
          variant={ModalVariant.medium}
          title={`Changes in ${diffData?.branch} compared to main`}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          {diffData?.changes.length ? (
            <ul>
              {diffData.changes.map((change) => (
                <li key={change.file}>
                  {change.file} - <strong>{change.status}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>No differences found.</p>
          )}
        </Modal>
        <Modal
          variant={ModalVariant.small}
          title="Deleting Contribution"
          titleIconVariant="warning"
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          actions={[
            <Button key="confirm" variant="primary" onClick={() => handleDeleteContributionConfirm()}>
              Delete
            </Button>,
            <Button key="cancel" variant="secondary" onClick={() => handleDeleteContributionCancel()}>
              Cancel
            </Button>
          ]}
        >
          <p>are you sure you want to delete this contribution?</p>
        </Modal>

        <Modal
          variant={ModalVariant.small}
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          aria-labelledby="form-modal-title"
          aria-describedby="modal-box-description-form"
        >
          <ModalHeader
            title="Publish Contribution"
            description="Publish your contribution to remote taxonomy repository"
            descriptorId="modal-box-description-form"
            labelId="form-modal-title"
          />
          <ModalBody>
            <Form id="modal-with-form-form">
              <FormGroup label="Taxonomy Path">
                <TextInput
                  isRequired
                  type="email"
                  id="modal-with-form-form-name"
                  name="modal-with-form-form-name"
                  placeholder={defaultTaxonomyRepoDir === '' ? 'Please enter the taxonomy repo directory path.' : defaultTaxonomyRepoDir}
                  value={selectedTaxonomyRepoDir}
                  onChange={(_event, value) => setSelectedTaxonomyRepoDir(value)}
                />
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button key="publish" variant="primary" form="modal-with-form-form" onClick={() => handlePublishContributionConfirm()}>
              Publish
            </Button>
            <Button key="cancel" variant="link" onClick={() => handlePublishContributionCancel()}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </PageSection>
    </div>
  );
};

export { DashboardNative };